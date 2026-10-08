import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { parseSupplierFile } from "./parse";

export async function importSupplierList(supplierId: string, filename: string, bytes: Buffer) {
  if (!/\.(pdf|xlsx|docx)$/i.test(filename))
    throw new Error("Subí un PDF, Excel XLSX o Word DOCX.");
  if (bytes.length < 1 || bytes.length > 32 * 1024 * 1024)
    throw new Error("El archivo debe pesar hasta 32 MB.");
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) throw new Error("Proveedor inexistente.");
  const fileHash = createHash("sha256").update(bytes).digest("hex");
  const found = await prisma.supplierPriceList.findUnique({
    where: { supplierId_fileHash: { supplierId, fileHash } },
  });
  if (found) throw new Error("Esta lista ya fue cargada.");
  const parsed = await parseSupplierFile(filename, bytes, supplier.name);
  const list = await prisma.supplierPriceList.create({
    data: {
      supplierId,
      filename,
      content: new Uint8Array(bytes),
      fileHash,
      rows: parsed.rows,
      notes: parsed.notes,
    },
  });
  return { id: list.id, count: parsed.rows.length };
}
