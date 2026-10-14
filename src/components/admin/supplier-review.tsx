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
  prepareSupplierSelection,
} from "@/server/suppliers/actions";
import { ActionForm } from "./action-form";
import { PriceDisplay } from "./price-display";
import type { buildSupplierReviewPlan } from "@/server/suppliers/review-plan";
export type SupplierVariantOption = VariantOption;
export function SupplierReview({
  id,
  filename,
  status,
  rows,
  notes,
  variants,
  plan,
}: {
  id: string;
  filename: string;
  status: string;
  rows: ImportedRow[];
  notes: string | null;
  variants: SupplierVariantOption[];
  plan: ReturnType<typeof buildSupplierReviewPlan>;
}) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(status === "REVIEW");
  const row = rows[selected];
  const coordinate = filename.toLowerCase().endsWith(".xlsx")
    ? "fila"
    : filename.toLowerCase().endsWith(".pdf")
      ? "página"
      : "sección de texto";
  const pending = rows.filter(
    (r, index) => !r.excluded &&
      (r.warning || r.price == null || !r.variantId || plan[index].kind === "review"),
  ).length;
  const ready = plan.filter((item) => item.kind === "exact" || item.kind === "confirmed");
  const omitted = plan.length - ready.length;
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
      {status === "REVIEW" && (
        <section className="admin-bulk-review" aria-label="Selección masiva de artículos">
          <h3>Elegí solo lo que vende Alambres Tandil</h3>
          <p className="admin-help">
            Comparamos con las medidas de la hoja Stock de Alambres Tandil.xlsx. {ready.length}{" "}
            coincidencias exactas · {omitted} filas sin coincidencia segura o con lectura dudosa.
            Los artículos del proveedor que no elijas quedan fuera; ningún precio de venta cambia
            acá.
          </p>
          {ready.length > 0 ? (
            <ActionForm
              action={prepareSupplierSelection}
              success="Selección preparada. Revisá el resumen y aprobá los costos."
            >
              <input hidden name="listId" value={id} readOnly />
              <div className="admin-bulk-list">
                {ready.map(({ index, variantId, kind }) => (
                  <label key={index} className="admin-bulk-row">
                    <input type="checkbox" name="selected" value={index} defaultChecked />
                    <span>
                      <strong>{rows[index].name}</strong>
                      <small>
                        Código {rows[index].code} ·{" "}
                        {kind === "confirmed" ? "Vínculo confirmado" : "Coincidencia exacta"} ·{" "}
                        {variants.find((v) => v.id === variantId)?.name}
                      </small>
                    </span>
                    <b>
                      {rows[index].price?.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </b>
                  </label>
                ))}
              </div>
              <label className="admin-check">
                <input type="checkbox" name="confirmed" required /> Revisé la selección contra la
                lista original; los costos se tomarán literalmente, sin descuentos ni IVA inferidos.
              </label>
              <button className="admin-button">Preparar artículos seleccionados</button>
            </ActionForm>
          ) : (
            <p className="admin-notice">
              No hay coincidencias automáticas seguras. Vinculá manualmente solo los artículos que
              trabajás.
            </p>
          )}
        </section>
      )}
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
                  ) : plan[index].kind === "review" || r.warning || r.price == null ? (
                    <>
                      <AlertTriangle size={14} /> Revisar
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />{" "}
                      {plan[index].kind === "exact" ? "Coincide" : "Lista"}
                    </>
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
                      {row.excluded ? "Volver a incluir esta fila" : "Excluir esta fila de la selección"}
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
            Aprobar actualiza solo sus costos. Conserva el stock y los precios de venta.
          </p>
          <button disabled={pending > 0 || !rows.some((r) => !r.excluded)} className="admin-button">
            Aprobar costos de la lista
          </button>
        </ActionForm>
      )}
    </details>
  );
}
