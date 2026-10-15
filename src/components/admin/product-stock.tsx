"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, ClipboardCheck } from "lucide-react";
import { recordCountForm, recordStockForm } from "@/server/inventory/actions";
import { roundQuantity } from "@/features/inventory/stock";
import { unitLabel } from "@/lib/format";
export type ProductStockVariant = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  onHand: number;
  reserved: number;
  minStock: number;
};
function StockRow({ variant }: { variant: ProductStockVariant }) {
  const router = useRouter();
  const [mode, setMode] = useState<"entry" | "exit" | "count">("entry"),
    [quantity, setQuantity] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const available = variant.onHand - variant.reserved,
    low = available <= variant.minStock,
    unit = unitLabel(variant.unit);
  const next =
    quantity === ""
      ? null
      : mode === "count"
        ? Number(quantity)
        : roundQuantity(variant.onHand + (mode === "entry" ? 1 : -1) * Number(quantity));
  return (
    <article className="admin-stock-row">
      <div className="admin-section-heading">
        <div>
          <h3>{variant.name}</h3>
          <p>
            {variant.sku} · {unit}
          </p>
        </div>
        <span className={low ? "admin-badge-warning" : "admin-badge"}>
          {available.toLocaleString("es-AR")} {unit} disponibles{low ? " · Reponer" : ""}
        </span>
      </div>
      <div className="admin-stock-balances">
        <span>
          Físico <strong>{variant.onHand.toLocaleString("es-AR")}</strong>
        </span>
        <span>
          Reservado <strong>{variant.reserved.toLocaleString("es-AR")}</strong>
        </span>
        <span>
          Mínimo <strong>{variant.minStock.toLocaleString("es-AR")}</strong>
        </span>
      </div>
      <details className="admin-disclosure">
        <summary>Ingresar o actualizar stock</summary>
        <div className="admin-stock-modes">
          {(
            [
              { id: "entry", label: "Ingresar mercadería", Icon: Plus },
              { id: "exit", label: "Registrar salida", Icon: Minus },
              { id: "count", label: "Contar existencias", Icon: ClipboardCheck },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              type="button"
              disabled={busy}
              key={id}
              aria-pressed={mode === id}
              onClick={() => {
                setMode(id);
                setQuantity("");
                setError("");
                setMessage("");
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            setMessage("");
            try {
              if (mode === "count") {
                form.set("counted", quantity);
                await recordCountForm(form);
              } else {
                form.set("type", mode === "entry" ? "ENTRADA" : "AJUSTE");
                form.set("quantity", String(Number(quantity) * (mode === "entry" ? 1 : -1)));
                await recordStockForm(form);
              }
              setMessage("Stock actualizado. El movimiento quedó registrado.");
              setQuantity("");
              router.refresh();
            } catch (error) {
              setError(error instanceof Error ? error.message : "No se pudo registrar el stock.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input hidden name="variantId" value={variant.id} readOnly />
          <div className="admin-form-grid">
            <label>
              {mode === "count"
                ? "Cantidad total contada"
                : mode === "entry"
                  ? "Cantidad que ingresa"
                  : "Cantidad que sale"}{" "}
              ({unit})
              <input
                className="admin-input"
                disabled={busy}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
                min={
                  mode === "count"
                    ? variant.reserved
                    : variant.unit === "KG" || variant.unit === "METRO"
                      ? 0.001
                      : 1
                }
                step={variant.unit === "KG" || variant.unit === "METRO" ? "0.001" : "1"}
                required
              />
            </label>
            <label>
              Motivo
              <input
                className="admin-input"
                name="reason"
                disabled={busy}
                required
                minLength={3}
                placeholder={
                  mode === "entry"
                    ? "Ej. Entrega del proveedor"
                    : mode === "exit"
                      ? "Ej. Material dañado"
                      : "Ej. Recuento de depósito"
                }
              />
            </label>
          </div>
          {next != null && (
            <p className="admin-notice">
              Físico: {variant.onHand.toLocaleString("es-AR")} →{" "}
              <strong>
                {next.toLocaleString("es-AR")} {unit}
              </strong>{" "}
              · disponible: {(next - variant.reserved).toLocaleString("es-AR")}
            </p>
          )}
          <label className="admin-check">
            <input type="checkbox" disabled={busy} required key={`${mode}-${quantity}`} /> Confirmo
            la cantidad y el motivo del movimiento
          </label>
          <button
            className="admin-button"
            disabled={busy || next == null || next < variant.reserved}
          >
            {busy
              ? "Guardando…"
              : mode === "entry"
                ? "Confirmar ingreso"
                : mode === "exit"
                  ? "Confirmar salida"
                  : "Guardar recuento"}
          </button>
          {next != null && next < variant.reserved && (
            <p className="admin-error">El nuevo stock no alcanza para las reservas existentes.</p>
          )}
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="admin-success">
              {message}
            </p>
          )}
        </form>
      </details>
    </article>
  );
}
export function ProductStock({ variants }: { variants: ProductStockVariant[] }) {
  return (
    <section className="admin-section admin-anchor" aria-labelledby="stock-producto-titulo">
      <h2 id="stock-producto-titulo">Stock por medida</h2>
      <p className="admin-help">
        Disponible = físico − reservado. Cada ingreso, salida o recuento queda registrado.
      </p>
      {variants.length ? (
        <div>
          {variants.map((v) => (
            <StockRow variant={v} key={v.id} />
          ))}
        </div>
      ) : (
        <p className="admin-empty-inline">
          Agregá una medida o presentación para empezar a cargar stock.
        </p>
      )}
    </section>
  );
}
