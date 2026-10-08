import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { importSupplierList } from "@/features/suppliers/import";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(process.env.BETTER_AUTH_URL ?? request.url).origin)
      return Response.json({ error: "Origen no autorizado." }, { status: 403 });
    await requireArea("suppliers");
    const form = await request.formData();
    const uploadId = String(form.get("uploadId") ?? "");
    const supplierId = String(form.get("supplierId") ?? "");
    const filename = String(form.get("filename") ?? "");
    const total = Number(form.get("total"));
    if (
      !/^[0-9a-f-]{36}$/i.test(uploadId) ||
      !supplierId ||
      !/\.(pdf|xlsx|docx)$/i.test(filename) ||
      !Number.isInteger(total) ||
      total < 1 ||
      total > 16
    )
      return Response.json({ error: "Carga inválida." }, { status: 400 });
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) return Response.json({ error: "Proveedor inexistente." }, { status: 404 });
    if (form.get("complete") === "true") {
      const chunks = await prisma.supplierUploadChunk.findMany({
        where: { uploadId },
        orderBy: { index: "asc" },
      });
      if (
        chunks.length !== total ||
        chunks.some(
          (chunk, index) =>
            chunk.index !== index ||
            chunk.total !== total ||
            chunk.supplierId !== supplierId ||
            chunk.filename !== filename,
        )
      )
        return Response.json(
          { error: "Faltan partes del archivo. Volvé a subirlo." },
          { status: 400 },
        );
      const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.content)));
      const result = await importSupplierList(supplierId, filename, bytes);
      await prisma.supplierUploadChunk.deleteMany({ where: { uploadId } });
      return Response.json(result);
    }
    const index = Number(form.get("index"));
    const file = form.get("file");
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= total ||
      !(file instanceof File) ||
      file.size < 1 ||
      file.size > 2 * 1024 * 1024
    )
      return Response.json({ error: "Parte inválida." }, { status: 400 });
    if (index === 0)
      await prisma.supplierUploadChunk.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } },
      });
    await prisma.supplierUploadChunk.upsert({
      where: { uploadId_index: { uploadId, index } },
      create: {
        uploadId,
        index,
        supplierId,
        filename,
        total,
        content: Buffer.from(await file.arrayBuffer()),
      },
      update: {},
    });
    return Response.json({ received: index + 1 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo completar la carga." },
      { status: 400 },
    );
  }
}
