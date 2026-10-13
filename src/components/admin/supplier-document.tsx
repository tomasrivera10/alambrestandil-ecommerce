"use client";
import { useEffect, useRef, useState } from "react";
import type { DocumentPreview } from "@/server/suppliers/preview";
export function SupplierDocument({
  id,
  filename,
  page,
}: {
  id: string;
  filename: string;
  page: number;
}) {
  const [preview, setPreview] = useState<DocumentPreview | null>(null),
    [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const pdf = filename.toLowerCase().endsWith(".pdf");
  useEffect(() => {
    if (pdf) return;
    const controller = new AbortController();
    fetch(`/api/admin/supplier-lists/${id}/preview`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPreview(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "No se pudo leer el original.");
      });
    return () => controller.abort();
  }, [id, pdf]);
  useEffect(() => {
    const table = container.current;
    if (preview?.kind !== "spreadsheet" || !table) return;
    const row = table.querySelector<HTMLElement>(`[data-row="${page}"]`);
    if (row) table.scrollTop = Math.max(0, row.offsetTop - table.offsetTop - 80);
  }, [preview, page]);
  return (
    <div className="admin-document">
      <a
        className="admin-button-secondary"
        href={`/api/admin/supplier-lists/${id}#page=${page}`}
        target="_blank"
        rel="noreferrer"
      >
        Abrir documento original
      </a>
      {pdf ? (
        <iframe
          key={page}
          title={`Lista ${filename}, página ${page}`}
          src={`/api/admin/supplier-lists/${id}#page=${page}&view=FitH`}
        />
      ) : error ? (
        <p role="alert" className="admin-error">
          {error} Podés abrir el archivo original.
        </p>
      ) : !preview ? (
        <p role="status" className="admin-help">
          Preparando vista del original…
        </p>
      ) : preview.kind === "text" ? (
        <>
          <p className="admin-help">Texto original de Word · sin paginación ni diseño de página</p>
          <pre className="admin-original-text">{preview.text}</pre>
          {preview.truncated && (
            <p className="admin-help">
              Vista parcial. Abrí el original para revisar el documento completo.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="admin-help">
            Hoja original: {preview.sheet} · fila {page}
          </p>
          <div ref={container} className="admin-original-table">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  {preview.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.number}
                    data-row={row.number}
                    className={row.number === page ? "is-selected-row" : ""}
                  >
                    <th>{row.number}</th>
                    {row.cells.map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.truncated && (
            <p className="admin-help">
              Vista limitada a 1000 filas y 40 columnas. Abrí el original para revisar el resto.
            </p>
          )}
        </>
      )}
    </div>
  );
}
