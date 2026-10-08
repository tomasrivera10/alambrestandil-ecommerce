"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SupplierUpload({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error("El archivo supera el máximo de 32 MB.");
      let response: Response;
      if (file.size <= 2 * 1024 * 1024) {
        const form = new FormData();
        form.set("supplierId", supplierId);
        form.set("file", file);
        response = await fetch("/api/admin/supplier-lists", { method: "POST", body: form });
      } else {
        const chunkSize = 2 * 1024 * 1024;
        const total = Math.ceil(file.size / chunkSize);
        const uploadId = crypto.randomUUID();
        for (let index = 0; index < total; index++) {
          const form = new FormData();
          form.set("uploadId", uploadId);
          form.set("supplierId", supplierId);
          form.set("filename", file.name);
          form.set("total", String(total));
          form.set("index", String(index));
          form.set("file", file.slice(index * chunkSize, (index + 1) * chunkSize), file.name);
          setMessage(`Subiendo parte ${index + 1} de ${total}…`);
          const part = await fetch("/api/admin/supplier-lists/chunks", {
            method: "POST",
            body: form,
          });
          if (!part.ok)
            throw new Error((await part.json()).error ?? "No se pudo subir el archivo.");
        }
        const complete = new FormData();
        complete.set("uploadId", uploadId);
        complete.set("supplierId", supplierId);
        complete.set("filename", file.name);
        complete.set("total", String(total));
        complete.set("complete", "true");
        setMessage("Leyendo productos y precios…");
        response = await fetch("/api/admin/supplier-lists/chunks", {
          method: "POST",
          body: complete,
        });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`${result.count} filas detectadas. Revisá la lista antes de aprobar.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo procesar el archivo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-card p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) void upload(file);
      }}
    >
      <p className="font-medium">Arrastrá una lista de precios acá</p>
      <p className="mt-1 text-sm text-muted-foreground">
        PDF, Excel o Word · hasta 32 MB · ninguna fila se publica sin revisión
      </p>
      <label className="mt-4 inline-flex cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-within:outline-2">
        {busy ? "Procesando…" : "Elegir archivo"}
        <input
          className="sr-only"
          type="file"
          accept=".pdf,.xlsx,.docx"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      <p className="mt-3 text-sm" role="status">
        {message}
      </p>
    </div>
  );
}
