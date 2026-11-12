import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { supplierReviewRevision } from "@/server/suppliers/review-revision";
import type { ImportedRow } from "@/server/suppliers/parse";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireArea("suppliers");
  } catch {
    return new Response("No autorizado", { status: 403 });
  }
  const rawIndex = new URL(request.url).searchParams.get("row");
  if (rawIndex == null || !/^\d+$/.test(rawIndex))
    return new Response("Fila inválida", { status: 400 });
  const { id } = await params;
  const list = await prisma.supplierPriceList.findUnique({
    where: { id },
    select: { content: true, rows: true, filename: true },
  });
  const revision = new URL(request.url).searchParams.get("revision");
  if (list && revision && revision !== supplierReviewRevision(list.rows))
    return new Response("La lectura cambió. Actualizá la lista.", { status: 409 });
  const row = (list?.rows as ImportedRow[] | undefined)?.[Number(rawIndex)];
  if (
    !list ||
    !list.filename.toLowerCase().endsWith(".pdf") ||
    !row?.page ||
    row.documentY == null ||
    !Number.isFinite(row.documentY)
  )
    return new Response("Recorte no disponible", { status: 404 });
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("@napi-rs/canvas");
    const task = pdfjs.getDocument({
      data: new Uint8Array(list.content),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const document = await task.promise;
    try {
      const page = await document.getPage(row.page);
      const viewport = page.getViewport({ scale: 1.5 });
      if (viewport.width * viewport.height > 20_000_000)
        return new Response("Página demasiado grande", { status: 422 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({
        canvasContext: canvas.getContext("2d") as never,
        canvas: canvas as never,
        viewport,
      }).promise;
      const [, y] = viewport.convertToViewportPoint(0, row.documentY);
      const bounds = row.sourceBounds;
      if (
        bounds &&
        Object.values(bounds).some((value) => !Number.isFinite(value) || value < 0 || value > 1.01)
      )
        return new Response("Recorte inválido", { status: 422 });
      const top = Math.max(
        0,
        Math.min(canvas.height - 1, Math.floor(bounds ? bounds.y * viewport.height : y - 32)),
      );
      const left = bounds
        ? Math.max(0, Math.min(canvas.width - 1, Math.floor(bounds.x * viewport.width)))
        : 0;
      const height = Math.min(
        bounds ? Math.ceil(bounds.height * viewport.height) : 64,
        canvas.height - top,
      );
      const width = Math.min(
        bounds ? Math.ceil(bounds.width * viewport.width) : canvas.width,
        canvas.width - left,
      );
      if (height < 1 || width < 1) return new Response("Recorte vacío", { status: 422 });
      const crop = createCanvas(width, height);
      crop.getContext("2d").drawImage(canvas, left, top, width, height, 0, 0, width, height);
      return new Response(new Uint8Array(crop.toBuffer("image/png")), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } finally {
      await task.destroy();
    }
  } catch {
    return new Response("No se pudo mostrar el recorte. Abrí el original.", { status: 422 });
  }
}
