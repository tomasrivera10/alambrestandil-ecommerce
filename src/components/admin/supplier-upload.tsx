"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadCloud, FileCheck2, AlertTriangle } from "lucide-react";
import { FadeContent } from "@/components/store/fade-content";

export function SupplierUpload({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [listId, setListId] = useState("");
  const lock = useRef(false);
  async function upload(file: File) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    setListId("");
    setProgress(5);
    setMessage("");
    try {
      if (!/\.(pdf|xlsx|docx)$/i.test(file.name))
        throw new Error("Usá PDF, Excel XLSX o Word DOCX.");
      if (!file.size) throw new Error("El archivo está vacío.");
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
          setProgress(Math.round(((index + 1) / total) * 70));
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
        setProgress(80);
        setMessage("Leyendo productos y precios…");
        response = await fetch("/api/admin/supplier-lists/chunks", {
          method: "POST",
          body: complete,
        });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setListId(result.id);
      setProgress(100);
      setMessage(
        `${result.count} ${result.count === 1 ? "artículo detectado" : "artículos detectados"}. Revisá la lista antes de aprobar.`,
      );
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "No se pudo procesar el archivo.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className={`admin-upload ${dragging ? "is-dragging" : ""}`}
      aria-label="Subir lista de precios"
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (busy) return;
        if (e.dataTransfer.files.length !== 1) {
          setFailed(true);
          setMessage("Subí una lista por vez para revisar sus artículos.");
          return;
        }
        const file = e.dataTransfer.files[0];
        if (file) void upload(file);
      }}
    >
      <UploadCloud size={36} strokeWidth={1.5} />
      <div>
        <h2>Arrastrá tu lista de precios</h2>
        <p>PDF, Excel o Word · hasta 32 MB</p>
        <p>Leemos los artículos y costos. Vos revisás antes de aprobar.</p>
      </div>
      <label className="admin-button-secondary">
        {busy ? "Procesando lista…" : "Elegir archivo"}
        <input
          className="sr-only"
          type="file"
          accept=".pdf,.xlsx,.docx"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </label>
      {busy && (
        <div className="admin-upload-progress">
          <progress value={progress} max={100} aria-label="Progreso de carga" />
          <p role="status">{message || "Subiendo y analizando el archivo…"}</p>
        </div>
      )}
      {!busy && message && (
        <FadeContent className={`admin-upload-result ${failed ? "admin-error" : "admin-success"}`}>
          <p role={failed ? "alert" : "status"}>
            {failed ? <AlertTriangle size={18} /> : <FileCheck2 size={18} />} {message}
          </p>
          {listId && (
            <a href={`#lista-${listId}`} className="admin-button">
              Revisar artículos y costos
            </a>
          )}
        </FadeContent>
      )}
    </section>
  );
}
