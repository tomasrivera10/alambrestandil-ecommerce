import { config } from "dotenv";
import { createConnection } from "node:net";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

config({ path: [".env.development.local", ".env.local", ".env.development", ".env"], quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Falta DATABASE_URL en .env. Configurá la conexión antes de iniciar la web.");
  process.exit(1);
}

let target;
try {
  target = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL no tiene un formato válido. Revisá .env.");
  process.exit(1);
}

const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
const prismaLocal =
  local &&
  ((target.protocol === "prisma+postgres:" && target.port === "51213") ||
    (["postgres:", "postgresql:"].includes(target.protocol) && target.port === "51214"));

if (prismaLocal) {
  const ready = await new Promise((resolve) => {
    const connection = createConnection({
      host: target.hostname.replace(/^\[|\]$/g, ""),
      port: Number(target.port),
    });
    const finish = (value) => {
      connection.destroy();
      resolve(value);
    };
    connection.setTimeout(1500);
    connection.once("connect", () => finish(true));
    connection.once("error", () => finish(false));
    connection.once("timeout", () => finish(false));
  });
  if (ready) {
    console.log("Base de datos local disponible. Iniciando Next.js…");
  } else {
    console.log("Iniciando la base de datos local alambrestandil…");
    const cli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
    const result = spawnSync(process.execPath, [cli, "dev", "start", "alambrestandil"], {
      stdio: "inherit",
    });
    if (result.error || result.status !== 0) {
      console.error("No se pudo iniciar la base local. Revisá con: npm run db:start");
      process.exit(1);
    }
  }
}
