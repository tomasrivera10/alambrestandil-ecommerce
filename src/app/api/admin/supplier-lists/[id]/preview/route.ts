import { requireArea } from "@/server/rbac";
import { prisma } from "@/server/db";
import { originalDocumentPreview } from "@/server/suppliers/preview";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireArea("suppliers");
  } catch {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const list = await prisma.supplierPriceList.findUnique({
    where: { id },
    select: { filename: true, content: true },
  });
  if (!list) return Response.json({ error: "Lista inexistente" }, { status: 404 });
  try {
    return Response.json(await originalDocumentPreview(list.filename, Buffer.from(list.content)), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo preparar la vista previa." },
      { status: 400 },
    );
  }
}
