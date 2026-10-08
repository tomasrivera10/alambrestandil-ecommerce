import "dotenv/config";
import { retireLegacyGalleryImages } from "./apply-product-images";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

// Initial imports execute many queries against the remote database.
const prisma = new PrismaClient({
  transactionOptions: { maxWait: 10000, timeout: 300000 },
});

import { importCatalog } from "./import-catalog";
import { applyProductImages, applyPostImages, applyGateImages, applyInstalledDoorImage, applyFeaturedImages } from "./apply-product-images";

async function main() {
  await importCatalog(prisma);
  await applyProductImages(prisma);
  await applyPostImages(prisma);
  await applyGateImages(prisma);
  await applyInstalledDoorImage(prisma);
  await applyFeaturedImages(prisma);
  await retireLegacyGalleryImages(prisma);

  for (const name of ["Particular", "Constructor", "Alambrador", "Rural", "Empresa", "Mayorista", "Frecuente"]) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  await prisma.orderCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 1047 },
  });

  const settings: Record<string, string> = {
    whatsapp: process.env.WHATSAPP_NUMBER ?? "5492494214973",
    hours: "Lunes a viernes de 8 a 12 y de 15 a 19. Sábados de 8 a 12.",
    address: "Ijurco 1480, esquina colectora Macaya, Ruta 226, Tandil",
    estimateNotice:
      "Esta lista es una estimación para conversar. No reemplaza una medición ni un presupuesto cerrado.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@alambrestandil.local";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.warn("Sin SEED_ADMIN_PASSWORD: no se creó el usuario admin.");
  } else {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const id = randomUUID();
      await prisma.user.create({
        data: {
          id,
          name: "Administración",
          email,
          emailVerified: true,
          role: "ADMIN",
          accounts: {
            create: {
              id: randomUUID(),
              accountId: id,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
