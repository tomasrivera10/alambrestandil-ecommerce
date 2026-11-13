ALTER TABLE "Product" ADD COLUMN "purchasePrice" DECIMAL(12,2), ADD COLUMN "discountPrice" DECIMAL(12,2), ADD COLUMN "promotionName" TEXT, ADD COLUMN "promotionStartsAt" TIMESTAMP(3), ADD COLUMN "promotionEndsAt" TIMESTAMP(3);
ALTER TABLE "ProductVariant" ADD COLUMN "purchasePrice" DECIMAL(12,2), ADD COLUMN "discountPrice" DECIMAL(12,2);
