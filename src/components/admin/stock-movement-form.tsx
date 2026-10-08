"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordStockForm } from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function StockMovementForm({
  variants,
}: {
  variants: { id: string; name: string; sku: string; unit: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [selected, setSelected] = useState(variants[0]?.id || "");
  const unit = variants.find((v) => v.id === selected)?.unit;
  return (
    <form
      className="grid max-w-2xl gap-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setMessage("");
        try {
          await recordStockForm(data);
          setMessage("Movimiento registrado. El stock ya está actualizado.");
          form.reset();
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "No se pudo registrar el movimiento.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-heading text-xl">Registrar movimiento</h2>
      <label className="grid gap-1">
        Producto / variante
        <select
          name="variantId"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          className="h-10 min-w-0 border border-input px-2"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.sku} · {v.name} ({v.unit.toLowerCase()})
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          Tipo
          <select name="type" className="h-10 border border-input px-2">
            <option value="ENTRADA">Entrada de mercadería</option>
            <option value="AJUSTE">Ajuste (+ / −)</option>
            <option value="DEVOLUCION">Devolución</option>
          </select>
        </label>
        <label className="grid gap-1">
          Cantidad ({unit?.toLowerCase()})
          <Input
            name="quantity"
            type="number"
            step={unit === "KG" || unit === "METRO" ? "0.001" : "1"}
            required
          />
        </label>
      </div>
      <label className="grid gap-1">
        Motivo
        <Input
          name="reason"
          required
          minLength={3}
          placeholder="Ej. Recuento físico del depósito"
        />
      </label>
      <p className="text-muted-foreground">
        El ajuste suma o resta al saldo. Para la carga inicial, registrá una entrada con el recuento
        actual. Las reservas se gestionan desde los pedidos.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={busy || !variants.length} type="submit">
          {busy ? "Registrando…" : "Registrar movimiento"}
        </Button>
        <p role="status">{message}</p>
      </div>
    </form>
  );
}
