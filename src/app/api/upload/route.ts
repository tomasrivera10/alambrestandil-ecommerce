import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/rbac";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readUploadForm } from "@/lib/upload-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(process.env.BETTER_AUTH_URL ?? request.url).origin) {
    return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  }
  const session = await getSession();
  const role = session?.user && "role" in session.user ? String(session.user.role) : "";
  if (!session || (role !== "ADMIN" && role !== "STOCK")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await readUploadForm(request);
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 413 });
    }
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }
  if (file.size === 0 || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "La foto debe pesar hasta 8 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "jpg" : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png" : bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP" ? "webp" : null;
  if (!extension) return NextResponse.json({ error: "Elegí una imagen JPG, PNG o WebP válida." }, { status: 400 });
  const filename = `${randomUUID()}.${extension}`;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Configurá BLOB_READ_WRITE_TOKEN para guardar imágenes. También podés usar una URL HTTPS." }, { status: 503 });
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory,filename),bytes);
    return NextResponse.json({ url: `/uploads/${filename}` });
  }
  const blob = await put(`productos/${filename}`, bytes, {
    access: "public",
    contentType: extension === "jpg" ? "image/jpeg" : `image/${extension}`,
  });
  return NextResponse.json({ url: blob.url });
}
