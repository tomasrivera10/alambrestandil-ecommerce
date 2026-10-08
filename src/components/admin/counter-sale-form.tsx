"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCounterSale } from "@/features/sales/actions";

type Variant = { id: string; name: string; sku: string; available: number; price: number | null };
export function CounterSaleForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [lines, setLines] = useState([
    { variantId: variants[0]?.id ?? "", quantity: 1, unitPrice: variants[0]?.price ?? 0 },
  ]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="admin-panel grid gap-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const form = new FormData(e.currentTarget);
        try {
          await recordCounterSale({
            channel: form.get("channel"),
            customerName: form.get("customerName"),
            lines,
          });
          setMessage("Venta registrada y stock descontado.");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "No se pudo registrar la venta.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="admin-section-title">Nueva venta</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Canal
          <select name="channel" className="admin-input">
            <option value="MOSTRADOR">Mostrador</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Cliente (opcional)
          <input name="customerName" className="admin-input" />
        </label>
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_110px_140px_auto]"
        >
          <label className="grid gap-1 text-sm">
            Producto
            <select
              className="admin-input"
              value={line.variantId}
              onChange={(e) => {
                const variant = variants.find((v) => v.id === e.target.value);
                setLines(
                  lines.map((v, n) =>
                    n === i
                      ? { ...v, variantId: e.target.value, unitPrice: variant?.price ?? 0 }
                      : v,
                  ),
                );
              }}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sku} · {v.name} ({v.available})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Cantidad
            <input
              className="admin-input"
              type="number"
              min="0.001"
              step="0.001"
              value={line.quantity}
              onChange={(e) =>
                setLines(
                  lines.map((v, n) => (n === i ? { ...v, quantity: Number(e.target.value) } : v)),
                )
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            Precio final
            <input
              className="admin-input"
              type="number"
              min="0"
              step="0.01"
              value={line.unitPrice}
              onChange={(e) =>
                setLines(
                  lines.map((v, n) => (n === i ? { ...v, unitPrice: Number(e.target.value) } : v)),
                )
              }
            />
          </label>
          <button
            type="button"
            className="admin-button-secondary self-end"
            onClick={() => setLines(lines.filter((_, n) => n !== i))}
            disabled={lines.length === 1}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-button-secondary justify-self-start"
        onClick={() =>
          setLines([
            ...lines,
            { variantId: variants[0]?.id ?? "", quantity: 1, unitPrice: variants[0]?.price ?? 0 },
          ])
        }
      >
        Agregar producto
      </button>
      <p className="text-sm font-semibold">
        Total: ${" "}
        {lines
          .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
          .toLocaleString("es-AR")}
      </p>
      <button className="admin-button justify-self-start" disabled={busy || !variants.length}>
        {busy ? "Guardando…" : "Confirmar venta"}
      </button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
