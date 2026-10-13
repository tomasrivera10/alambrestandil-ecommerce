import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(16).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  WHATSAPP_NUMBER: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
});

export function authSecret() {
  if (process.env.NODE_ENV === "production") {
    if (
      !env.BETTER_AUTH_SECRET ||
      env.BETTER_AUTH_SECRET.length < 32 ||
      env.BETTER_AUTH_SECRET === "dev-only-secret-change-me-please"
    ) {
      throw new Error("Producción requiere BETTER_AUTH_SECRET único de al menos 32 caracteres.");
    }
    if (!env.BETTER_AUTH_URL || new URL(env.BETTER_AUTH_URL).protocol !== "https:") {
      throw new Error("Producción requiere BETTER_AUTH_URL con HTTPS.");
    }
  }
  return env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me-please";
}
