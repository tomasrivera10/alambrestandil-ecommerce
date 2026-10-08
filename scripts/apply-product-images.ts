import "dotenv/config";
import { retireLegacyGalleryImages } from "../prisma/apply-product-images";
import { PrismaClient } from "../src/generated/prisma/client";
import { applyProductImages, applyPostImages, applyGateImages, applyInstalledDoorImage, applyFeaturedImages } from "../prisma/apply-product-images";

const prisma = new PrismaClient();
applyProductImages(prisma)
  .then(() => applyPostImages(prisma))
  .then(() => applyGateImages(prisma))
  .then(() => applyInstalledDoorImage(prisma))
  .then(() => applyFeaturedImages(prisma))
  .then(() => retireLegacyGalleryImages(prisma))
  .then(() => console.log("Imágenes del catálogo actualizadas."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
