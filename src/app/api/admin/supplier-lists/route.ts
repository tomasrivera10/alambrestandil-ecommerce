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
    const supplierId = String(form.get("supplierId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > 2 * 1024 * 1024)
      return Response.json(
        { error: "Usá la carga en partes para archivos mayores a 2 MB." },
        { status: 400 },
      );
    return Response.json(
      await importSupplierList(supplierId, file.name, Buffer.from(await file.arrayBuffer())),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo leer la lista." },
      { status: 400 },
    );
  }
}
