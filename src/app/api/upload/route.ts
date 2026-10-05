import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/rbac";

export async function POST(request: Request) {
  const session = await getSession();
  const role = session?.user && "role" in session.user ? String(session.user.role) : "";
  if (!session || (role !== "ADMIN" && role !== "STOCK")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Falta el almacenamiento de imágenes" }, { status: 503 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }
  const blob = await put(`productos/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  return NextResponse.json({ url: blob.url });
}
