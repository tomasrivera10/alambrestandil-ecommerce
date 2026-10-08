CREATE TABLE "SupplierUploadChunk" (
  "uploadId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "supplierId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "total" INTEGER NOT NULL,
  "content" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierUploadChunk_pkey" PRIMARY KEY ("uploadId", "index")
);
CREATE INDEX "SupplierUploadChunk_createdAt_idx" ON "SupplierUploadChunk"("createdAt");
