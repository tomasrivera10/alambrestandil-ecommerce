import { PrismaClient } from "@/generated/prisma/client";
import path from "node:path";

// Bundling relocates Prisma's generated client, so its default lookup misses
// the engine included by outputFileTracingIncludes in Vercel Functions.
if (process.env.VERCEL && process.platform === "linux" && process.arch === "x64") {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY ??= path.join(
    process.cwd(),
    "src/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function safeQuery<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
