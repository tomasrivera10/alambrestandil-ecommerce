"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordStockForm } from "@/server/inventory/actions";
import { unitLabel } from "@/lib/format";
import { roundQuantity } from "@/features/inventory/stock";

export function StockMovementForm({
  variants,
}: {
  variants: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    onHand: number;
    reserved: number;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(variants[0]?.id ?? "");
  const [type, setType] = useState("AJUSTE");
  const [quantity, setQuantity] = useState("");
  const current = variants.find((item) => item.id === selected);
  const decimal = current?.unit === "KG" || current?.unit === "METRO";
  const amount = Number(quantity);
  const next = current && quantity !== "" ? roundQuantity(current.onHand + amount) : null;
  const valid =
    current &&
    quantity !== "" &&
    Number.isFinite(amount) &&
    amount !== 0 &&
    (type === "AJUSTE" || amount > 0) &&
    (decimal || Number.isInteger(amount)) &&
    next != null &&
    next >= current.reserved;
  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || !valid) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setMessage("");
        setError("");
        try {
          await recordStockForm(data);
          setMessage("Movimiento confirmado. El stock y el historial están actualizados.");
          setQuantity("");
          router.refresh();
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo registrar. Revisá los datos e intentá de nuevo.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="grid gap-4">
        <label className="grid gap-1">
          Presentación
          <select
            name="variantId"
            required
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              setQuantity("");
              setError("");
              setMessage("");
            }}
          >
            {variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.sku}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            Movimiento
            <select
              name="type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setQuantity("");
              }}
            >
              <option value="AJUSTE">Ajuste: sumar o restar</option>
              <option value="DEVOLUCION">Devolución al depósito</option>
              <option value="ENTRADA">Ingreso de mercadería</option>
            </select>
          </label>
          <label className="grid gap-1">
            Cantidad ({unitLabel(current?.unit ?? "UNIDAD")})
            <input
              name="quantity"
              type="number"
              step={decimal ? "0.001" : "1"}
              min={type === "AJUSTE" ? undefined : decimal ? "0.001" : "1"}
              required
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setMessage("");
                setError("");
              }}
            />
          </label>
        </div>
        <p className="admin-help">
          En un ajuste, usá una cantidad negativa para restar. Para reemplazar el total físico, usá
          Recuento físico.
        </p>
        <label className="grid gap-1">
          Motivo
          <input
            name="reason"
            required
            minLength={3}
            placeholder="Ej. Material dañado en depósito"
          />
        </label>
        {next != null && current && (
          <p className="admin-notice">
            Físico: {current.onHand.toLocaleString("es-AR")} →{" "}
            <strong>{next.toLocaleString("es-AR")}</strong>. Disponible:{" "}
            {roundQuantity(next - current.reserved).toLocaleString("es-AR")}{" "}
            {unitLabel(current.unit)}.
          </p>
        )}
        {next != null && current && next < current.reserved && (
          <p className="admin-error">El nuevo stock no alcanza para las reservas existentes.</p>
        )}
        <label className="admin-check">
          <input type="checkbox" required key={`${selected}-${type}-${quantity}`} />
          Confirmo la cantidad y el motivo del movimiento
        </label>
        <button className="admin-button" type="submit" disabled={busy || !valid}>
          {busy ? "Guardando…" : "Confirmar movimiento"}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </form>
  );
}
