ALTER TABLE "ProductVariant" ADD COLUMN "sourceReference" TEXT, ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "sourceUrl" TEXT, ADD COLUMN "isReference" BOOLEAN NOT NULL DEFAULT false;
