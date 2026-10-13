-- CreateTable
CREATE TABLE "MarginPolicy" (
    "key" TEXT NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "confirmedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarginPolicy_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MarketListing" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "identity" TEXT NOT NULL,
    "sourceIdentity" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "refreshedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceChange" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "oldPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "supplierItemId" TEXT NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "market" DECIMAL(12,2),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketListing_url_key" ON "MarketListing"("url");

-- CreateIndex
CREATE INDEX "MarketListing_variantId_verifiedAt_idx" ON "MarketListing"("variantId", "verifiedAt");

-- CreateIndex
CREATE INDEX "PriceChange_variantId_createdAt_idx" ON "PriceChange"("variantId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceChange" ADD CONSTRAINT "PriceChange_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
