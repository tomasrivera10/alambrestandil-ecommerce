"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { ImportedRow } from "@/server/suppliers/parse";
import { COST_CHANGE_LIMIT, type SupplierReviewDecision } from "@/server/suppliers/review-plan";
import { rollbackSupplierList, approveSupplierListForm } from "@/server/suppliers/actions";
import {
  reviewSupplierRows,
  reprocessSupplierList,
  restoreSupplierRead,
} from "@/server/suppliers/bulk-actions";
import { SupplierDocument } from "./supplier-document";
import { ActionForm } from "./action-form";
import type { VariantOption } from "./variant-select";
import styles from "./supplier-review.module.css";

export type SupplierVariantOption = VariantOption;
type Edit = {
  index: number;
  name: string;
  price: string;
  currency: "ARS" | "USD";
  unit: string;
  variantId: string;
};
type Filter = "work" | "unmatched" | "pending" | "excluded" | "all";
const money = (value: number | null | undefined, currency = "ARS") =>
  value == null ? "Sin costo" : value.toLocaleString("es-AR", { style: "currency", currency });

export function SupplierReview({
  id,
  filename,
  status,
  rows,
  notes,
  variants,
  plan,
  revision,
}: {
  id: string;
  filename: string;
  status: string;
  rows: ImportedRow[];
  notes: string | null;
  variants: SupplierVariantOption[];
  plan: SupplierReviewDecision[];
  revision: string;
}) {
  const editing = status === "REVIEW";
  const [expanded, setExpanded] = useState(editing);
  const [filter, setFilter] = useState<Filter>(editing ? "work" : "all");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<number | null>(null);
  const [modified, setModified] = useState<Set<number>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const dirty = modified.size > 0;
  const initialEdits = (): Edit[] =>
    rows.map((row, index) => {
      const decision = plan[index];
      const variantId =
        row.variantId ??
        decision.variantId ??
        (decision.suggestedVariantIds?.length === 1 ? decision.suggestedVariantIds[0] : "");
      return {
        index,
        name: row.name,
        price: row.price?.toFixed(2).replace(".", ",") ?? "",
        currency: row.currency ?? "ARS",
        variantId,
        unit: row.unit ?? variants.find((v) => v.id === variantId)?.unit ?? "",
      };
    });
  const [edits, setEdits] = useState(initialEdits);
  const [selected, setSelected] = useState<Set<number>>(
    () =>
      new Set(
        plan
          .filter((item) => item.kind === "exact" && !rows[item.index].reviewed)
          .map((item) => item.index),
      ),
  );
  const isPending = (index: number) =>
    !rows[index].excluded &&
    (plan[index].kind === "review" || !rows[index].variantId || !!rows[index].warning);
  const hasLink = (index: number) => !!edits[index].variantId;
  const pending = rows.filter((_, index) => isPending(index)).length;
  const unmatched = rows.filter((row, index) => !row.excluded && !hasLink(index)).length;
  const visible = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => {
      const match =
        filter === "all" ||
        (filter === "excluded"
          ? row.excluded
          : !row.excluded &&
            (filter === "work"
              ? hasLink(index)
              : filter === "unmatched"
                ? !hasLink(index)
                : isPending(index)));
      return (
        match &&
        `${edits[index].name} ${row.code}`
          .toLocaleLowerCase("es")
          .includes(query.toLocaleLowerCase("es"))
      );
    });
  const unsavedOutsideSelection = [...modified].some((index) => !selected.has(index));
  const perform = async (action: (form: FormData) => Promise<unknown>, form: FormData) => {
    setSaving(true);
    try {
      await action(form);
    } finally {
      setSaving(false);
    }
  };
  const selectedEdits = edits.filter((edit) => selected.has(edit.index));
  const allVisibleSelected =
    visible.length > 0 && visible.every(({ index }) => selected.has(index));
  const legacy =
    filename.toLowerCase().endsWith(".pdf") && rows.every((row) => row.parserVersion !== 2);
  const updateEdit = (index: number, change: Partial<Edit>) => {
    setModified((current) => new Set(current).add(index));
    setSelected((current) => new Set(current).add(index));
    setEdits((current) =>
      current.map((edit) => (edit.index === index ? { ...edit, ...change } : edit)),
    );
  };
  const setGroup = (indices: number[]) => setSelected(new Set(indices));
  const decisionLabel = (index: number) =>
    rows[index].excluded
      ? "Omitido"
      : plan[index].kind === "confirmed"
        ? "Confirmado"
        : plan[index].kind === "exact"
          ? "Coincidencia exacta"
          : hasLink(index)
            ? "Propuesta para confirmar"
            : "Sin vínculo";
  const revisionFields = (
    <>
      <input hidden name="listId" value={id} readOnly />
      <input hidden name="revision" value={revision} readOnly />
    </>
  );

  return (
    <details
      className="admin-disclosure admin-list-review"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <FileText size={18} />
        <span>{filename}</span>
        <span className={editing ? "admin-badge-warning" : "admin-badge"}>
          {editing
            ? `${pending} pendientes`
            : status === "ROLLED_BACK"
              ? "Costos revertidos"
              : "Costos aprobados"}
        </span>
      </summary>
      {expanded && (
        <fieldset className="admin-action-fields" disabled={saving}>
          <p className="admin-help">
            {notes} Los costos se toman literalmente, sin IVA ni descuentos inferidos.
          </p>
          {editing && legacy && (
            <section className={styles.refresh}>
              <div>
                <h3>Este PDF conserva la lectura anterior</h3>
                <p>
                  Volvé a leer las filas visibles para separar texto oculto, completar descripciones
                  y recuperar las columnas de precios. Guardamos un respaldo y conservamos las
                  confirmaciones que coincidan sin dudas.
                </p>
              </div>
              <ActionForm
                action={(form) => perform(reprocessSupplierList, form)}
                success="Lectura actualizada."
              >
                {revisionFields}
                <button className="admin-button-secondary" disabled={dirty}>
                  Actualizar lectura del PDF
                </button>
              </ActionForm>
            </section>
          )}
          <div className={styles.heading}>
            <div>
              <h3>Revisá y confirmá en conjunto</h3>
              <p>
                {rows.length} artículos leídos ·{" "}
                {rows.length - unmatched - rows.filter((row) => row.excluded).length} con vínculo o
                propuesta · {unmatched} sin vínculo. Variaciones mayores al {COST_CHANGE_LIMIT}% y
                lecturas dudosas se señalan en la tabla.
              </p>
            </div>
          </div>
          <div className={styles.toolbar}>
            <label>
              Mostrar
              <select
                className="admin-input"
                value={filter}
                onChange={(event) => setFilter(event.target.value as Filter)}
              >
                <option value="work">Con vínculo o propuesta</option>
                <option value="unmatched">Sin vínculo ({unmatched})</option>
                <option value="pending">Pendientes ({pending})</option>
                <option value="excluded">Omitidos</option>
                <option value="all">Todos ({rows.length})</option>
              </select>
            </label>
            <label>
              Buscar artículo
              <input
                className="admin-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Descripción o código"
              />
            </label>
          </div>
          {editing && (
            <div className={styles.selection}>
              <button
                type="button"
                className="admin-button-secondary"
                onClick={() =>
                  setGroup(plan.filter((item) => item.kind === "exact").map((item) => item.index))
                }
              >
                Seleccionar coincidencias
              </button>
              <button
                type="button"
                className="admin-button-secondary"
                onClick={() => {
                  setGroup(
                    rows.flatMap((row, index) => (!row.excluded && hasLink(index) ? [index] : [])),
                  );
                  setFilter("work");
                }}
              >
                Seleccionar con vínculo o propuesta
              </button>
              <button
                type="button"
                className="admin-button-secondary"
                onClick={() => {
                  setGroup(
                    rows.flatMap((row, index) => (!row.excluded && !hasLink(index) ? [index] : [])),
                  );
                  setFilter("unmatched");
                }}
              >
                Seleccionar sin vínculo
              </button>
              <button type="button" className="admin-text-button" onClick={() => setGroup([])}>
                Limpiar selección
              </button>
              <span role="status">
                {selected.size} seleccionados
                {selectedEdits.some((edit) => !visible.some(({ index }) => index === edit.index))
                  ? " (incluye otras vistas)"
                  : ""}
              </span>
            </div>
          )}
          <div
            className={styles.tableScroll}
            tabIndex={0}
            aria-label="Artículos de la lista; desplazamiento horizontal disponible"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  {editing && (
                    <th scope="col">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos los artículos visibles"
                        checked={allVisibleSelected}
                        onChange={(event) =>
                          setSelected((current) => {
                            const next = new Set(current);
                            visible.forEach(({ index }) =>
                              event.target.checked ? next.add(index) : next.delete(index),
                            );
                            return next;
                          })
                        }
                      />
                    </th>
                  )}
                  <th scope="col">Artículo del proveedor</th>
                  <th scope="col">Costo y moneda</th>
                  <th scope="col">Medida de tu tienda</th>
                  <th scope="col">Validación</th>
                  <th scope="col">Original</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ row, index }) => (
                  <Row
                    key={index}
                    index={index}
                    row={row}
                    edit={edits[index]}
                    decision={plan[index]}
                    label={decisionLabel(index)}
                    editing={editing}
                    variants={variants}
                    selected={selected.has(index)}
                    sourceOpen={source === index}
                    onSelect={(checked) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (checked) next.add(index);
                        else next.delete(index);
                        return next;
                      })
                    }
                    onChange={(change) => updateEdit(index, change)}
                    onSource={() => setSource(source === index ? null : index)}
                    listId={id}
                    filename={filename}
                    revision={revision}
                  />
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <p className={styles.empty}>
                {filter === "work" && unmatched > 0
                  ? "No hay vínculos seguros todavía. Elegí Sin vínculo para asociarlos en la tabla o seleccionar y omitir varios juntos."
                  : "No hay artículos en esta vista."}
              </p>
            )}
          </div>
          {editing && (
            <div className={styles.actions}>
              <ActionForm
                action={async (form) => {
                  form.set("mode", "include");
                  await perform(reviewSupplierRows, form);
                }}
                success="Selección confirmada. Podés aprobar sus costos cuando no queden pendientes."
              >
                {revisionFields}
                <input hidden name="edits" value={JSON.stringify(selectedEdits)} readOnly />
                <label className="admin-check">
                  <input type="checkbox" name="confirmed" required /> Confirmo los productos,
                  medidas, unidades y costos seleccionados, incluidas las propuestas y alertas
                  visibles.
                </label>
                <button
                  className="admin-button"
                  disabled={!selected.size || unsavedOutsideSelection}
                >
                  Confirmar {selected.size || ""} artículos seleccionados
                </button>
              </ActionForm>
              <ActionForm
                action={async (form) => {
                  form.set("mode", "exclude");
                  await perform(reviewSupplierRows, form);
                }}
                success="Selección omitida. Podés volver a incluirla desde Omitidos."
              >
                {revisionFields}
                <input hidden name="edits" value={JSON.stringify(selectedEdits)} readOnly />
                <p>
                  Los artículos omitidos no cambian costos. Podés recuperarlos desde el filtro
                  Omitidos.
                </p>
                <button
                  className="admin-button-secondary"
                  disabled={!selected.size || unsavedOutsideSelection}
                >
                  Omitir {selected.size || ""} seleccionados
                </button>
              </ActionForm>
            </div>
          )}
          {editing && (
            <ActionForm
              action={(form) => perform(approveSupplierListForm, form)}
              success="Costos aprobados."
            >
              {revisionFields}
              <p className="admin-help">
                {rows.filter((row) => !row.excluded).length} incluidos · {pending} pendientes.
                Primero confirmá u omití los pendientes; después aprobá el lote. Actualiza costos y
                conserva stock y precios de venta.
              </p>
              <button
                className="admin-button"
                disabled={dirty || pending > 0 || !rows.some((row) => !row.excluded)}
              >
                Aprobar costos del lote
              </button>
            </ActionForm>
          )}
          {editing && unsavedOutsideSelection && (
            <p role="alert" className="admin-notice">
              Hay artículos editados fuera de la selección. Seleccionalos o descartá sus ediciones
              antes de guardar otros.
            </p>
          )}
          {editing && dirty && (
            <button
              type="button"
              className="admin-text-button"
              onClick={() => {
                setEdits(initialEdits());
                setModified(new Set());
              }}
            >
              Descartar ediciones locales y volver a los datos guardados
            </button>
          )}
          {editing && dirty && (
            <p role="status" className="admin-notice">
              Hay ediciones locales sin guardar. Confirmá u omití la selección antes de actualizar
              la lectura o aprobar el lote.
            </p>
          )}
          {editing && rows[0]?.readBackup && (
            <details className={styles.backup}>
              <summary>Respaldo de lectura anterior</summary>
              <p>
                Restaurar recupera las filas y decisiones anteriores a la última relectura.
                Reemplaza las confirmaciones realizadas desde entonces.
              </p>
              <ActionForm
                action={(form) => perform(restoreSupplierRead, form)}
                success="Lectura anterior restaurada."
              >
                {revisionFields}
                <label className="admin-check">
                  <input type="checkbox" name="confirmed" required /> Quiero recuperar la lectura
                  anterior y sus decisiones.
                </label>
                <button className="admin-button-secondary" disabled={dirty}>
                  Restaurar lectura anterior
                </button>
              </ActionForm>
            </details>
          )}
          {status === "APPROVED" && rows.some((row) => row.appliedItemId) && (
            <ActionForm
              action={(form) => perform(rollbackSupplierList, form)}
              success="Costos anteriores restaurados."
            >
              <input hidden name="listId" value={id} readOnly />
              <label className="admin-check">
                <input type="checkbox" name="confirmed" required /> Restaurar los costos anteriores,
                si no hubo cambios posteriores.
              </label>
              <button className="admin-button-secondary">Revertir aprobación</button>
            </ActionForm>
          )}
        </fieldset>
      )}
    </details>
  );
}

function Row({
  index,
  row,
  edit,
  decision,
  label,
  editing,
  variants,
  selected,
  sourceOpen,
  onSelect,
  onChange,
  onSource,
  listId,
  filename,
  revision,
}: {
  index: number;
  row: ImportedRow;
  edit: Edit;
  decision: SupplierReviewDecision;
  label: string;
  editing: boolean;
  variants: VariantOption[];
  selected: boolean;
  sourceOpen: boolean;
  onSelect: (checked: boolean) => void;
  onChange: (change: Partial<Edit>) => void;
  onSource: () => void;
  listId: string;
  filename: string;
  revision: string;
}) {
  const [imageError, setImageError] = useState(false);
  return (
    <>
      <tr className={selected ? styles.selected : undefined}>
        {editing && (
          <td>
            <input
              type="checkbox"
              checked={selected}
              aria-label={`Seleccionar artículo ${index + 1}: ${row.name}`}
              onChange={(event) => onSelect(event.target.checked)}
            />
          </td>
        )}
        <td>
          {editing ? (
            <input
              className="admin-input"
              aria-label={`Descripción del artículo ${index + 1}`}
              value={edit.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          ) : (
            <strong>{row.name}</strong>
          )}
          <small>
            #{index + 1} · página/fila {row.page ?? 1} · {row.code}
          </small>
        </td>
        <td>
          {editing ? (
            <>
              <input
                className="admin-input"
                inputMode="decimal"
                aria-label={`Costo del artículo ${index + 1}`}
                value={edit.price}
                onChange={(event) => onChange({ price: event.target.value })}
              />
              <select
                className="admin-input"
                aria-label={`Moneda del artículo ${index + 1}`}
                value={edit.currency}
                onChange={(event) => onChange({ currency: event.target.value as "ARS" | "USD" })}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD · convertir</option>
              </select>
            </>
          ) : (
            money(row.price, row.currency)
          )}
          <small>
            Leído:{" "}
            {money(
              Object.hasOwn(row, "sourcePrice") ? row.sourcePrice : row.price,
              row.sourceCurrency ?? row.currency,
            )}
          </small>
          {decision.previousPrice != null && (
            <small>
              Anterior: {money(decision.previousPrice)} ·{" "}
              {decision.changePercent != null
                ? `${decision.changePercent > 0 ? "+" : ""}${decision.changePercent.toFixed(1)}%`
                : ""}
            </small>
          )}
        </td>
        <td>
          {editing ? (
            <select
              className="admin-input"
              value={edit.variantId}
              aria-label={`Medida para artículo ${index + 1}`}
              onChange={(event) =>
                onChange({
                  variantId: event.target.value,
                  unit: variants.find((variant) => variant.id === event.target.value)?.unit ?? "",
                })
              }
            >
              <option value="">Elegir medida de la tienda</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
          ) : (
            (variants.find((variant) => variant.id === edit.variantId)?.name ?? "Sin vínculo")
          )}
          <small>Unidad: {edit.unit || "pendiente"}</small>
        </td>
        <td>
          <strong className={decision.kind === "review" ? styles.warning : styles.valid}>
            {label}
          </strong>
          <small>
            {decision.reason ??
              row.warning ??
              (row.extraction === "verified" ? "Texto y lectura visual coinciden" : "")}
          </small>
          {row.currency === "USD" && (
            <small className={styles.warning}>No se incluye hasta convertir a ARS.</small>
          )}
        </td>
        <td>
          <button
            type="button"
            className="admin-text-button"
            onClick={onSource}
            aria-expanded={sourceOpen}
          >
            {sourceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{" "}
            {sourceOpen ? "Cerrar" : "Ver original"}
          </button>
        </td>
      </tr>
      {sourceOpen && (
        <tr>
          <td colSpan={editing ? 6 : 5}>
            <div className={styles.source}>
              {row.sourceBounds && !imageError ? (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/supplier-lists/${listId}/crop?row=${index}&revision=${revision}`}
                    alt={`Fila original de ${row.name}`}
                    onError={() => setImageError(true)}
                  />
                  <figcaption>
                    Original · página {row.page ?? 1}. Compará la descripción, la presentación y el
                    importe antes de confirmar.
                  </figcaption>
                </figure>
              ) : (
                <SupplierDocument id={listId} filename={filename} page={row.page ?? 1} />
              )}
              <a
                className="admin-text-button"
                href={`/api/admin/supplier-lists/${listId}#page=${row.page ?? 1}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir documento completo
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
