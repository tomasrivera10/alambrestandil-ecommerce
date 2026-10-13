import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
type Credentials = { accessToken: string; refreshToken: string; expiresAt: number };
const keyName = "market.mercadolibre.credentials";
export function marketConnected() {
  return (
    !!process.env.MERCADOLIBRE_ACCESS_TOKEN ||
    !!(
      process.env.MERCADOLIBRE_CLIENT_ID &&
      process.env.MERCADOLIBRE_CLIENT_SECRET &&
      process.env.MERCADOLIBRE_REFRESH_TOKEN
    )
  );
}
function encryptionKey() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Configurá un secreto de aplicación seguro para conectar el mercado.");
  return createHash("sha256").update(`market:${secret}`).digest();
}
function seal(credentials: Credentials) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes].map((b) => b.toString("base64")).join(".");
}
function open(value: string): Credentials {
  const [iv, tag, bytes] = value.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(bytes), decipher.final()]).toString("utf8"));
}
let cached: Credentials | null = null;
let pending: Promise<string | null> | null = null;
async function resolveMarketToken() {
  if (
    !process.env.MERCADOLIBRE_CLIENT_ID ||
    !process.env.MERCADOLIBRE_CLIENT_SECRET ||
    !process.env.MERCADOLIBRE_REFRESH_TOKEN
  )
    return process.env.MERCADOLIBRE_ACCESS_TOKEN ?? null;
  // A database lock serializes rotating refresh tokens across parallel Functions.
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(19381934)`;
      const saved = await tx.siteSetting.findUnique({ where: { key: keyName } });
      const credentials = saved ? open(saved.value) : null;
      if (credentials && credentials.expiresAt > Date.now() + 60000) return credentials.accessToken;
      const response = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.MERCADOLIBRE_CLIENT_ID!,
          client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET!,
          refresh_token: credentials?.refreshToken ?? process.env.MERCADOLIBRE_REFRESH_TOKEN!,
        }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok)
        throw new Error("No se pudo renovar la conexión de Mercado Libre. Revisá la autorización.");
      const data = await response.json();
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string" ||
        !Number.isFinite(data.expires_in) ||
        data.expires_in <= 0
      )
        throw new Error("Mercado Libre devolvió una autorización incompleta.");
      cached = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };
      const value = seal(cached);
      await tx.siteSetting.upsert({
        where: { key: keyName },
        create: { key: keyName, value },
        update: { value },
      });
      return data.access_token as string;
    },
    { timeout: 20000, maxWait: 10000 },
  );
}

export async function marketToken() {
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.accessToken;
  if (pending) return pending;
  pending = resolveMarketToken();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
