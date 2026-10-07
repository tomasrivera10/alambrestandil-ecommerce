"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveVariant } from "@/features/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type EditableVariant = {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  price: number | null;
  salesUnit: string | null;
  active: boolean;
  sourceReference: string | null;
  reviewNote: string | null;
  inventory: { onHand: number; reserved: number; minStock: number } | null;
};

function VariantForm({
  productId,
  variant,
  onSaved,
}: {
  productId: string;
  variant?: EditableVariant;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-4 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const form = new FormData(e.currentTarget);
        try {
          const attributes: Record<string, string> = {};
          for (const line of String(form.get("attributes"))
            .split("\n")
            .filter((s) => s.trim())) {
            const colon = line.indexOf(":");
            if (colon < 1 || !line.slice(colon + 1).trim())
              throw new Error("Escribí cada atributo como altura: 1.50 m, uno por línea.");
            attributes[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
          }
          await saveVariant({
            id: variant?.id,
            productId,
            name: String(form.get("name")),
            sku: String(form.get("sku")),
            attributes,
            price: String(form.get("price")),
            salesUnit: (String(form.get("salesUnit")) || null) as "KG" | null,
            minStock: Number(form.get("minStock")),
            active: form.get("active") === "on",
            reviewNote: String(form.get("reviewNote") || ""),
          });
          setMessage("Variante guardada.");
          toast.success("Variante guardada.");
          router.refresh();
          onSaved?.();
        } catch (cause) {
          setMessage(
            cause instanceof Error ? cause.message : "No se pudo guardar. Revisá los datos.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {variant?.sourceReference && (
        <p className="text-xs text-muted-foreground">Origen: {variant.sourceReference}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Nombre / medida
          <Input name="name" required minLength={2} defaultValue={variant?.name} />
        </label>
        <label className="grid gap-1 text-sm">
          Código SKU
          <Input name="sku" required minLength={2} defaultValue={variant?.sku} />
        </label>
        <label className="grid gap-1 text-sm">
          Unidad de venta
          <select
            name="salesUnit"
            defaultValue={variant?.salesUnit || ""}
            className="h-10 border border-input px-3"
          >
            <option value="">Usar unidad del producto</option>
            {["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Precio propio (ARS)
          <Input
            name="price"
            inputMode="decimal"
            placeholder="Usar precio del producto"
            defaultValue={variant?.price?.toString().replace(".", ",") || ""}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Stock mínimo
          <Input
            name="minStock"
            type="number"
            min={0}
            step="0.001"
            defaultValue={variant?.inventory?.minStock || 0}
          />
        </label>
        <p className="self-center text-sm text-muted-foreground">
          Físico: {variant?.inventory?.onHand ?? 0} · Reservado: {variant?.inventory?.reserved ?? 0}
          <br />
          Las cantidades se actualizan en Stock con un movimiento.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Atributos técnicos (uno por línea)
        <Textarea
          name="attributes"
          rows={4}
          placeholder={"altura: 1.50 m\ncalibre: 14"}
          defaultValue={Object.entries(variant?.attributes || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Nota interna de revisión
        <Textarea
          name="reviewNote"
          defaultValue={variant?.reviewNote || ""}
          placeholder="Medida, presentación o unidad pendiente de confirmar"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={variant ? variant.active : true} />
        Publicar esta variante
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={busy} type="submit">
          {busy ? "Guardando…" : "Guardar variante"}
        </Button>
        <p role="status" className="text-sm">
          {message}
        </p>
      </div>
    </form>
  );
}

export function VariantEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: EditableVariant[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="mt-10" aria-labelledby="variants-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="variants-title" className="font-heading text-xl">
          Medidas y presentaciones{" "}
          <span className="text-muted-foreground">({variants.length})</span>
        </h2>
        <Button variant="outline" onClick={() => setAdding(!adding)}>
          {adding ? "Cerrar nueva variante" : "Agregar variante"}
        </Button>
      </div>
      <p className="my-3 text-sm text-muted-foreground">
        Abrí una variante para editarla. Desactivarla la retira del catálogo y conserva su
        historial.
      </p>
      {adding && (
        <div className="mb-4 border border-border">
          <VariantForm productId={productId} onSaved={() => setAdding(false)} />
        </div>
      )}
      <div className="divide-y divide-border border-y border-border">
        {variants.map((v) => (
          <details key={v.id}>
            <summary className="cursor-pointer py-4 text-sm focus-visible:outline-2 focus-visible:outline-primary">
              <span className="font-medium">{v.name}</span>
              <span className="ml-3 text-muted-foreground">
                {v.sku} · {v.active ? "Publicada" : "Oculta"}
                {v.reviewNote ? " · Revisar datos" : ""}
              </span>
            </summary>
            <VariantForm key={JSON.stringify(v)} productId={productId} variant={v} />
          </details>
        ))}
      </div>
    </section>
  );
}
