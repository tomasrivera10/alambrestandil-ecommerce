import { spawnSync } from "node:child_process";

// Vercel injects these variables; never print their values in build logs.
for (const name of ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]) {
  if (!process.env[name]) throw new Error(`Configurá ${name} en Vercel antes de desplegar.`);
}
if (process.env.BETTER_AUTH_SECRET.length < 32 || process.env.BETTER_AUTH_SECRET === "dev-only-secret-change-me-please") {
  throw new Error("BETTER_AUTH_SECRET debe ser único y tener al menos 32 caracteres.");
}
const origin = new URL(process.env.BETTER_AUTH_URL);
if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash) {
  throw new Error("BETTER_AUTH_URL debe ser el origen HTTPS del sitio, sin rutas ni parámetros.");
}
const database = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(database.protocol) || ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
  throw new Error("DATABASE_URL debe apuntar a PostgreSQL externo, por ejemplo Neon.");
}
function run(args, commandEnv = process.env) {
  const result = spawnSync("npm", ["exec", "--", ...args], { stdio: "inherit", env: commandEnv });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["prisma", "generate"]);
// Previews must use their own database; migrations there are an explicit step.
if (process.env.VERCEL_ENV === "production") {
  // Session advisory locks used by migrations require a direct connection.
  const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
  const migrationEnv = { ...process.env, DATABASE_URL: migrationUrl };
  // Avoid acquiring a migration lock for code-only deployments when the
  // database is already up to date. Pending migrations still use normal locks.
  const status = spawnSync("npm", ["exec", "--", "prisma", "migrate", "status"], {
    stdio: "inherit",
    env: migrationEnv,
  });
  if (status.error) throw status.error;
  if (status.status !== 0) run(["prisma", "migrate", "deploy"], migrationEnv);
}
run(["next", "build", "--webpack"]);
