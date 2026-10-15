import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { applyStudioProductImages } from "../prisma/apply-studio-product-images";

const prisma = new PrismaClient();
applyStudioProductImages(prisma)
  .then((result) => console.log(JSON.stringify(result)))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
