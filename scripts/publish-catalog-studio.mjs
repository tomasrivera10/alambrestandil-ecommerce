import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Session is obtained with the configured administrator account; never saved in the repository.
const sessionFile = process.env.CATALOG_UPLOAD_SESSION;
if (!sessionFile)
  throw new Error("Configurá CATALOG_UPLOAD_SESSION con la sesión administrativa temporal.");
const { origin, cookie } = JSON.parse(await readFile(sessionFile, "utf8"));
const host = new URL(origin);
if (host.protocol !== "https:") throw new Error("El servidor de imágenes debe usar HTTPS.");
const filename = "src/content/catalog-studio.json";
const manifest = JSON.parse(await readFile(filename, "utf8"));
for (const [key, asset] of Object.entries(manifest.assets)) {
  const bytes = await readFile(`public${asset.localUrl}`);
  if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
    throw new Error(`Archivo modificado: ${key}`);
  if (asset.url.startsWith("https:")) {
    const existing = await fetch(asset.url);
    if (
      existing.ok &&
      createHash("sha256")
        .update(Buffer.from(await existing.arrayBuffer()))
        .digest("hex") === asset.sha256
    )
      continue;
  }
  const form = new FormData();
  form.set("file", new File([bytes], `${key}.webp`, { type: "image/webp" }));
  const response = await fetch(`${origin}/api/upload`, {
    method: "POST",
    headers: { Origin: origin, Cookie: cookie },
    body: form,
    redirect: "error",
  });
  if (!response.ok) throw new Error(`No se pudo publicar ${key}: HTTP ${response.status}`);
  const result = await response.json();
  const url = new URL(result.url);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com"))
    throw new Error(`Respuesta de almacenamiento inválida: ${key}`);
  const verify = await fetch(url);
  if (!verify.ok || !verify.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`La imagen publicada no responde: ${key}`);
  const remoteBytes = Buffer.from(await verify.arrayBuffer());
  if (createHash("sha256").update(remoteBytes).digest("hex") !== asset.sha256)
    throw new Error(`Imagen publicada distinta del original: ${key}`);
  asset.url = url.href;
  // Checkpoint every successful upload so retries never duplicate completed assets.
  await writeFile(filename, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Publicado y verificado: ${key}`);
}
console.log(
  `${Object.keys(manifest.assets).length} imágenes disponibles en el almacenamiento de la tienda.`,
);
