"use client";
import { SupplierDocument } from "./supplier-document";
import { VariantSelect, type VariantOption } from "./variant-select";
import { useState } from "react";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ImportedRow } from "@/server/suppliers/parse";
import {
  reviewSupplierRow,
  excludeSupplierRow,
  approveSupplierListForm,
} from "@/server/suppliers/actions";
import { ActionForm } from "./action-form";
import { PriceDisplay } from "./price-display";
export type SupplierVariantOption = VariantOption;
export function SupplierReview({
  id,
  filename,
  status,
  rows,
  notes,
  variants,
}: {
  id: string;
  filename: string;
  status: string;
  rows: ImportedRow[];
  notes: string | null;
  variants: SupplierVariantOption[];
}) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(status === "REVIEW");
  const row = rows[selected];
  const coordinate = filename.toLowerCase().endsWith(".xlsx")
    ? "fila"
    : filename.toLowerCase().endsWith(".pdf")
      ? "página"
      : "sección de texto";
  const pending = rows.filter((r) => !r.excluded && (r.warning || r.price == null)).length;
  return (
    <details
      className="admin-disclosure admin-list-review"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <FileText size={18} />
        <span>{filename}</span>
        <span className={status === "REVIEW" ? "admin-badge-warning" : "admin-badge"}>
          {status === "REVIEW"
            ? `${pending} ${pending === 1 ? "fila" : "filas"} por revisar`
            : "Costos aprobados"}
        </span>
      </summary>
      <p className="admin-help">
        {notes} Los importes se guardan tal como están en la lista, sin aplicar IVA ni descuentos.
      </p>
      <div className="admin-review-workspace">
        {expanded && <SupplierDocument id={id} filename={filename} page={row?.page ?? 1} />}
        <div>
          <div className="admin-row-picker" aria-label="Filas extraídas">
            {rows.map((r, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <span>
                  {index + 1}. {r.name}
                </span>
                <span>
                  {r.excluded ? (
                    "Omitida"
                  ) : r.warning || r.price == null ? (
                    <>
                      <AlertTriangle size={14} /> Revisar
                    </>
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                </span>
              </button>
            ))}
          </div>
          {row && (
            <div className="admin-extracted-row">
              <div className="admin-section-heading">
                <h3>
                  Artículo {selected + 1} · {coordinate} {row.page ?? 1}
                </h3>
                <span className="admin-badge">
                  {row.extraction === "ocr" ? "Lectura OCR" : "Texto extraído"}
                </span>
              </div>
              <PriceDisplay kind="cost" label="Costo leído" value={row.price} />
              {row.warning && (
                <p className="admin-notice">
                  <AlertTriangle size={16} />
                  {row.warning}
                </p>
              )}
              {status === "REVIEW" ? (
                <>
                  <ActionForm
                    key={`${selected}-${JSON.stringify(row)}`}
                    action={reviewSupplierRow}
                    className="admin-form"
                    success="Fila revisada. Continuá con la siguiente."
                  >
                    <input hidden name="listId" value={id} readOnly />
                    <input hidden name="index" value={selected} readOnly />
                    <div className="admin-form-grid">
                      <label>
                        Código del proveedor
                        <input
                          className="admin-input"
                          name="code"
                          required
                          defaultValue={row.code}
                        />
                      </label>
                      <label>
                        Costo literal (ARS)
                        <input
                          className="admin-input admin-money-input"
                          name="price"
                          inputMode="decimal"
                          required
                          defaultValue={row.price?.toFixed(2).replace(".", ",") ?? ""}
                        />
                      </label>
                      <label className="admin-span-all">
                        Producto
                        <input
                          className="admin-input"
                          name="name"
                          minLength={2}
                          required
                          defaultValue={row.name}
                        />
                      </label>
                      <label>
                        Unidad / presentación
                        <input
                          className="admin-input"
                          name="unit"
                          defaultValue={row.unit ?? ""}
                          placeholder="Ej. rollo de 25 metros"
                        />
                      </label>
                      <VariantSelect
                        label="Vincular con medida de la tienda"
                        options={variants}
                        defaultValue={row.variantId ?? ""}
                      />
                    </div>
                    <label className="admin-check">
                      <input name="confirmed" type="checkbox" required /> Revisé el producto, la
                      unidad y el costo contra el original
                    </label>
                    <button className="admin-button">Confirmar esta fila</button>
                  </ActionForm>
                  <ActionForm action={excludeSupplierRow}>
                    <input hidden name="listId" value={id} readOnly />
                    <input hidden name="index" value={selected} readOnly />
                    <button className="admin-text-button">
                      {row.excluded ? "Incluir esta fila" : "Omitir fila que no es un producto"}
                    </button>
                  </ActionForm>
                </>
              ) : (
                <p className="admin-help">
                  {row.name} · {row.unit || "Unidad sin aclarar"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {status === "REVIEW" && (
        <ActionForm
          action={approveSupplierListForm}
          success="Lista aprobada. Ya podés revisar los precios de venta."
        >
          <input hidden name="listId" value={id} readOnly />
          <p className="admin-help">
            {rows.filter((r) => !r.excluded).length} artículos incluidos · {pending} pendientes.
            Aprobar actualiza costos, conserva el stock y los precios de venta.
          </p>
          <button disabled={pending > 0 || !rows.some((r) => !r.excluded)} className="admin-button">
            Aprobar costos de la lista
          </button>
        </ActionForm>
      )}
    </details>
  );
}
