"use client";
/* eslint-disable @next/next/no-img-element -- Admin supports images from arbitrary HTTPS sources. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addProductImage,
  removeProductImage,
  setImageCover,
  updateProductImage,
} from "@/features/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ImageEditor({
  productId,
  name,
  images,
}: {
  productId: string;
  name: string;
  images: {
    id: string;
    url: string;
    alt: string;
    sourceUrl: string | null;
    isReference: boolean;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
      setMessage("Imágenes actualizadas.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10" aria-labelledby="images-title">
      <h2 id="images-title" className="font-heading text-xl">
        Imágenes
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        La primera imagen es la portada. Preferí fotos propias de al menos 1200 px. Marcá las fotos
        genéricas como referencia.
      </p>
      {!images.length && (
        <p className="my-4 border border-dashed border-border p-4 text-sm">
          Este producto todavía necesita una foto.
        </p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((photo, i) => (
          <div key={photo.id} className="border border-border p-3">
            <img
              src={photo.url}
              alt={photo.alt}
              className="aspect-square w-full object-contain bg-muted"
            />
            <p className="mt-2 text-sm">
              {i === 0 ? "Portada · " : ""}
              {photo.isReference ? "Imagen de referencia" : "Foto del producto"}
            </p>
            {photo.sourceUrl && (
              <a
                className="text-xs underline"
                href={photo.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver fuente original
              </a>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer underline">Editar descripción y origen</summary>
              <form
                className="mt-3 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  void run(() =>
                    updateProductImage(
                      photo.id,
                      productId,
                      String(form.get("alt")),
                      String(form.get("sourceUrl") || ""),
                      form.get("reference") === "on",
                    ),
                  );
                }}
              >
                <label className="grid gap-1">
                  Descripción
                  <Input name="alt" required minLength={3} defaultValue={photo.alt} />
                </label>
                <label className="grid gap-1">
                  Fuente
                  <Input name="sourceUrl" type="url" defaultValue={photo.sourceUrl || ""} />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="reference" defaultChecked={photo.isReference} />
                  Imagen de referencia
                </label>
                <Button size="sm" disabled={busy} type="submit">
                  Guardar imagen
                </Button>
              </form>
            </details>
            <div className="mt-3 flex flex-wrap gap-2">
              {i > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => setImageCover(photo.id, productId))}
                >
                  Usar de portada
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("¿Quitar esta imagen del producto?"))
                    void run(() => removeProductImage(photo.id, productId));
                }}
              >
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </div>
      <form
        className="mt-5 grid gap-4 border-t border-border pt-5 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const formElement = e.currentTarget;
          const form = new FormData(formElement);
          await run(async () => {
            let url = String(form.get("url") || "");
            const file = form.get("file");
            if (file instanceof File && file.size) {
              const body = new FormData();
              body.set("file", file);
              const result = await fetch("/api/upload", { method: "POST", body });
              const data = await result.json();
              if (!result.ok) throw new Error(data.error || "No se pudo subir la foto.");
              url = data.url;
            }
            if (!url) throw new Error("Elegí un archivo o pegá una URL de imagen.");
            await addProductImage(
              productId,
              url,
              String(form.get("alt")),
              String(form.get("sourceUrl") || ""),
              form.get("reference") === "on",
            );
            formElement.reset();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            Subir foto (JPG, PNG o WebP; hasta 8 MB)
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
          <label className="grid gap-1">
            O pegar URL de imagen
            <Input name="url" type="url" placeholder="https://…" />
          </label>
        </div>
        <label className="grid gap-1">
          Descripción de la imagen
          <Input name="alt" required minLength={3} defaultValue={name} />
        </label>
        <label className="grid gap-1">
          Página de origen (opcional para fotos propias)
          <Input name="sourceUrl" type="url" placeholder="https://sitio-del-fabricante/…" />
        </label>
        <label className="flex items-center gap-2">
          <input name="reference" type="checkbox" />
          Es una imagen de referencia; no muestra la variante exacta
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={busy} type="submit">
            {busy ? "Guardando…" : "Agregar imagen"}
          </Button>
          <p role="status">{message}</p>
        </div>
      </form>
    </section>
  );
}
