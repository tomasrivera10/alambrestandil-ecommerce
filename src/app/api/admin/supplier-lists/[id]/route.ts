import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireArea("suppliers");
    const { id } = await params;
    const list = await prisma.supplierPriceList.findUnique({
      where: { id },
      select: { content: true, filename: true },
    });
    if (!list) return new Response("Lista inexistente", { status: 404 });
    const name = list.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const type = name.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : name.toLowerCase().endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return new Response(new Uint8Array(list.content), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No autorizado", { status: 403 });
  }
}
