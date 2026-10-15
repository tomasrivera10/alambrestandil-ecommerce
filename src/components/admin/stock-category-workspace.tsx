/* eslint-disable @next/next/no-img-element -- Catalog photographs may use supplier hosts. */
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Search, Plus, Check, X } from "lucide-react";
import { recordStockForm } from "@/server/inventory/actions";
import { unitLabel } from "@/lib/format";

export type StockCategory = {
  id: string;
  name: string;
  image: string | null;
  rows: {
    id: string;
    productId: string;
    product: string;
    variant: string;
    sku: string;
    image: string | null;
    unit: string;
    onHand: number;
    reserved: number;
    minStock: number;
  }[];
};

function StockEntry({ row }: { row: StockCategory["rows"][number] }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [quantity, setQuantity] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const unit = unitLabel(row.unit);
  const decimal = row.unit === "KG" || row.unit === "METRO";
  const valid =
    Number.isFinite(Number(quantity)) &&
    Number(quantity) > 0 &&
    (decimal || Number.isInteger(Number(quantity)));

  return (
    <div className="workspace-stock-entry">
      {!editing ? (
        <button
          type="button"
          className="admin-button-secondary"
          disabled={refreshing}
          onClick={() => {
            setEditing(true);
            setMessage("");
          }}
        >
          <Plus size={16} aria-hidden="true" /> Sumar
        </button>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || refreshing || !valid) return;
            setBusy(true);
            setError("");
            setMessage("");
            const data = new FormData(event.currentTarget);
            data.set("variantId", row.id);
            data.set("type", "ENTRADA");
            data.set("quantity", quantity);
            data.set("reason", "Ingreso de mercadería desde Stock");
            try {
              await recordStockForm(data);
              setMessage(
                `Se sumaron ${Number(quantity).toLocaleString("es-AR")} ${unit}. Movimiento registrado.`,
              );
              setQuantity("");
              setEditing(false);
              startRefresh(() => router.refresh());
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "No se pudo sumar. Revisá la cantidad e intentá de nuevo.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy || refreshing}>
            <div className="workspace-entry-controls">
              <label>
                <span className="sr-only">
                  Cantidad que ingresa de {row.product}, {row.variant}, en {unit}
                </span>
                <input
                  type="number"
                  min={decimal ? "0.001" : "1"}
                  step={decimal ? "0.001" : "1"}
                  inputMode={decimal ? "decimal" : "numeric"}
                  required
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setError("");
                  }}
                  placeholder="Cantidad"
                />
              </label>
              <span>{unit}</span>
              <button
                type="button"
                className="workspace-icon-button"
                aria-label="Cancelar ingreso"
                onClick={() => {
                  setEditing(false);
                  setQuantity("");
                  setError("");
                }}
              >
                <X size={18} />
              </button>
            </div>
            {valid && (
              <p className="workspace-entry-preview">
                Físico: {row.onHand.toLocaleString("es-AR")} →{" "}
                <strong>
                  {(row.onHand + Number(quantity)).toLocaleString("es-AR")} {unit}
                </strong>
                <br />
                Disponible: {(row.onHand + Number(quantity) - row.reserved).toLocaleString(
                  "es-AR",
                )}{" "}
                {unit}
              </p>
            )}
            <button type="submit" className="admin-button" disabled={!valid || busy || refreshing}>
              <Check size={15} aria-hidden="true" />
              {busy ? "Guardando…" : "Confirmar ingreso"}
            </button>
          </fieldset>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
        </form>
      )}
      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}
    </div>
  );
}

export function StockCategoryWorkspace({ categories }: { categories: StockCategory[] }) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("categoria") ?? "";
  const state = params.get("state") ?? "all";
  const rows = categories.flatMap((item) =>
    item.rows.map((row) => ({ ...row, categoryId: item.id })),
  );
  const matching = rows.filter((row) => {
    const text = `${row.product} ${row.variant} ${row.sku}`.toLocaleLowerCase("es-AR");
    const available = row.onHand - row.reserved;
    const low = available <= 0 || (row.minStock > 0 && available <= row.minStock);
    return (
      text.includes(query.trim().toLocaleLowerCase("es-AR")) &&
      (!category || row.categoryId === category) &&
      (state === "low" ? low : state === "zero" ? available <= 0 : true)
    );
  });
  const pageCount = Math.max(1, Math.ceil(matching.length / 30));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(Number(params.get("pagina"))) || 1));
  const update = (name: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    if (name !== "pagina") url.searchParams.delete("pagina");
    window.history.replaceState(null, "", url);
  };
  return (
    <section className="workspace-inventory" aria-label="Existencias y entradas de mercadería">
      <div className="workspace-filterbar">
        <label className="workspace-search">
          <span>Buscar en todo el stock</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => update("q", event.target.value)}
              placeholder="Producto, medida o SKU"
            />
          </div>
        </label>
        <label>
          <span>Categoría</span>
          <select value={category} onChange={(event) => update("categoria", event.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Disponibilidad</span>
          <select value={state} onChange={(event) => update("state", event.target.value)}>
            <option value="all">Todo el stock</option>
            <option value="low">Para reponer</option>
            <option value="zero">Sin disponibilidad</option>
          </select>
        </label>
      </div>
      <div className="workspace-results">
        <p role="status">
          {matching.length} {matching.length === 1 ? "presentación" : "presentaciones"}
          {category
            ? ` en ${categories.find((item) => item.id === category)?.name ?? "la categoría"}`
            : " en todas las categorías"}
        </p>
        {(query || category || state !== "all") && <Link href="/admin/stock">Limpiar filtros</Link>}
      </div>
      <div
        className="workspace-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Stock por presentación"
      >
        <table className="workspace-table workspace-stock-table">
          <thead>
            <tr>
              <th>Producto / presentación</th>
              <th>Físico</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Mercadería que ingresa</th>
            </tr>
          </thead>
          <tbody>
            {matching.slice((page - 1) * 30, page * 30).map((row) => {
              const available = row.onHand - row.reserved;
              const low = available <= 0 || (row.minStock > 0 && available <= row.minStock);
              return (
                <tr key={row.id}>
                  <td>
                    <div className="workspace-product-cell">
                      <span className="workspace-thumb">
                        {row.image ? (
                          <img src={row.image} alt="" loading="lazy" />
                        ) : (
                          <Package size={24} aria-hidden="true" />
                        )}
                      </span>
                      <div>
                        <Link href={`/admin/productos/${row.productId}#stock-producto`}>
                          {row.product}
                        </Link>
                        <p>{row.variant}</p>
                        <small>
                          {row.sku} · {unitLabel(row.unit)}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="workspace-number" data-label="Físico">
                    {row.onHand.toLocaleString("es-AR")}
                  </td>
                  <td className="workspace-number" data-label="Reservado">
                    {row.reserved.toLocaleString("es-AR")}
                  </td>
                  <td className="workspace-number" data-label="Disponible">
                    <strong>{available.toLocaleString("es-AR")}</strong>
                    <span className={`workspace-stock-status ${low ? "is-low" : ""}`}>
                      {available <= 0 ? "Sin disponibilidad" : low ? "Reponer" : "Disponible"}
                    </span>
                  </td>
                  <td>
                    <StockEntry row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!matching.length && (
        <div className="workspace-empty">
          <Package size={30} aria-hidden="true" />
          <h2>
            {rows.length
              ? "No encontramos esa presentación"
              : "Todavía no hay stock para gestionar"}
          </h2>
          <p>
            {rows.length
              ? "Probá con el nombre del producto, una medida o su código."
              : "Agregá un producto y sus medidas para registrar el primer ingreso."}
          </p>
          <Link
            href={rows.length ? "/admin/stock" : "/admin/productos/nuevo"}
            className="admin-button-secondary"
          >
            {rows.length ? "Ver todo el stock" : "Agregar producto"}
          </Link>
        </div>
      )}
      {pageCount > 1 && (
        <nav className="workspace-pagination" aria-label="Páginas del stock">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => update("pagina", String(page - 1))}
          >
            Anterior
          </button>
          <span>
            Página {page} de {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => update("pagina", String(page + 1))}
          >
            Siguiente
          </button>
        </nav>
      )}
      <p className="workspace-footnote">
        Disponible = físico − reservado. Cada ingreso confirmado genera un movimiento en el
        historial.
      </p>
    </section>
  );
}
