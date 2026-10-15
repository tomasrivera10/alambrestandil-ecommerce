"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCountForm } from "@/server/inventory/actions";
import { unitLabel } from "@/lib/format";

export function StockCountForm({
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(variants[0]?.id ?? "");
  const [counted, setCounted] = useState("");
  const current = variants.find((item) => item.id === selected);
  const next = counted === "" ? null : Number(counted);
  const decimal = current?.unit === "KG" || current?.unit === "METRO";
  const valid =
    next != null &&
    Number.isFinite(next) &&
    next >= (current?.reserved ?? 0) &&
    (decimal || Number.isInteger(next));
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || !valid) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setMessage("");
        setError("");
        try {
          await recordCountForm(data);
          setMessage(
            next === current?.onHand
              ? "Recuento confirmado: coincide con el saldo. No fue necesario generar un ajuste."
              : "Recuento confirmado. La diferencia quedó registrada en el historial.",
          );
          setCounted("");
          router.refresh();
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo registrar. Revisá la cantidad e intentá de nuevo.",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="admin-form"
    >
      <fieldset disabled={busy} className="grid gap-4">
        <label className="grid gap-1">
          Presentación
          <select
            name="variantId"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              setCounted("");
              setMessage("");
              setError("");
            }}
          >
            {variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.sku}
              </option>
            ))}
          </select>
        </label>
        <p className="admin-help">
          Físico: {current?.onHand ?? 0} · Reservado: {current?.reserved ?? 0}
        </p>
        <label className="grid gap-1">
          Cantidad total contada ({unitLabel(current?.unit ?? "UNIDAD")})
          <input
            name="counted"
            required
            type="number"
            min={current?.reserved ?? 0}
            step={decimal ? "0.001" : "1"}
            value={counted}
            onChange={(event) => {
              setCounted(event.target.value);
              setMessage("");
              setError("");
            }}
          />
        </label>
        <label className="grid gap-1">
          Motivo
          <input name="reason" minLength={3} required placeholder="Ej. Recuento de cierre" />
        </label>
        {valid && current && (
          <p className="admin-notice">
            El stock físico quedará en{" "}
            <strong>
              {next?.toLocaleString("es-AR")} {unitLabel(current.unit)}
            </strong>
            . Disponible: {((next ?? 0) - current.reserved).toLocaleString("es-AR")}.
          </p>
        )}
        {next != null && next < (current?.reserved ?? 0) && (
          <p className="admin-error">
            La cantidad contada debe cubrir la reserva de {current?.reserved}{" "}
            {unitLabel(current?.unit ?? "UNIDAD")}.
          </p>
        )}
        <label className="admin-check">
          <input type="checkbox" required key={`${selected}-${counted}`} />
          Confirmo la cantidad contada y el motivo
        </label>
        <button type="submit" className="admin-button" disabled={busy || !current || !valid}>
          {busy ? "Guardando…" : "Confirmar recuento"}
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
