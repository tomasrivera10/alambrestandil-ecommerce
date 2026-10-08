"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCountForm } from "@/features/inventory/actions";

export function StockCountForm({
  variants,
}: {
  variants: { id: string; name: string; sku: string; onHand: number; reserved: number }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(variants[0]?.id ?? "");
  const current = variants.find((item) => item.id === selected);
  return (
    <form
      className="admin-panel grid gap-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          await recordCountForm(new FormData(e.currentTarget));
          setMessage("Recuento registrado.");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "No se pudo registrar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="admin-section-title">Recuento físico</h2>
      <label className="grid gap-1 text-sm">
        Producto
        <select
          className="admin-input"
          name="variantId"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.sku} · {v.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        En sistema: {current?.onHand ?? 0} físicos · {current?.reserved ?? 0} reservados
      </p>
      <label className="grid gap-1 text-sm">
        Cantidad contada
        <input className="admin-input" name="counted" required type="number" min="0" step="0.001" />
      </label>
      <label className="grid gap-1 text-sm">
        Motivo
        <input
          className="admin-input"
          name="reason"
          minLength={3}
          required
          placeholder="Recuento de cierre"
        />
      </label>
      <button className="admin-button" disabled={busy || !variants.length}>
        {busy ? "Guardando…" : "Registrar diferencia"}
      </button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
