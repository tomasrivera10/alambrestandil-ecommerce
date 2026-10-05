"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createQuote } from "@/features/quotes/actions";

export function InstallationForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        try {
          const result = await createQuote({
            origin: "INSTALLATION",
            name: String(form.get("name")),
            phone: String(form.get("phone")),
            locality: String(form.get("locality")),
            address: String(form.get("address")),
            notes: String(form.get("notes") || ""),
            payload: {
              tissue: form.get("tissue"),
              post: form.get("post"),
              terrain: form.get("terrain"),
              mesh: form.get("mesh"),
              length: form.get("length"),
              width: form.get("width"),
              depth: form.get("depth"),
              gate: form.get("gate"),
              gateLocation: form.get("gateLocation"),
            },
            items: [
              {
                name: `Instalación ${form.get("tissue")} con poste ${form.get("post")}`,
                quantity: 1,
                unit: "JUEGO",
                note: `Terreno ${form.get("length")} x ${form.get("width")} x ${form.get("depth")} m`,
              },
            ],
          });
          window.open(result.url, "_blank", "noopener,noreferrer");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No pudimos enviar la solicitud.");
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-muted-foreground">Al momento de la obra el suelo tiene que estar limpio.</p>
      <label className="grid gap-1">Nombre<Input name="name" required /></label>
      <label className="grid gap-1">Teléfono<Input name="phone" required /></label>
      <label className="grid gap-1">Localidad<Input name="locality" required defaultValue="Tandil" /></label>
      <label className="grid gap-1">Dirección de la obra<Input name="address" required /></label>
      <label className="grid gap-1">Tipo de tejido
        <select name="tissue" className="h-10 border border-input bg-card px-2">
          <option>Símil ligustrina</option>
          <option>Revestido en PVC</option>
          <option>Galvanizado romboidal</option>
        </select>
      </label>
      <label className="grid gap-1">Poste
        <select name="post" className="h-10 border border-input bg-card px-2">
          <option>Olímpico</option>
          <option>Recto</option>
        </select>
      </label>
      <label className="grid gap-1">Terreno
        <select name="terrain" className="h-10 border border-input bg-card px-2">
          <option>Lote</option>
          <option>Lote con ochava</option>
        </select>
      </label>
      <label className="grid gap-1">Malla
        <select name="mesh" className="h-10 border border-input bg-card px-2">
          <option>1 1/2</option>
          <option>2</option>
          <option>2 1/2</option>
          <option>3 1/2</option>
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="grid gap-1">Largo<Input name="length" required /></label>
        <label className="grid gap-1">Ancho<Input name="width" required /></label>
        <label className="grid gap-1">Fondo<Input name="depth" required /></label>
      </div>
      <label className="grid gap-1">Portón
        <select name="gate" className="h-10 border border-input bg-card px-2">
          <option>Caño estructural, línea económica</option>
          <option>Caño estructural, reforzado</option>
        </select>
      </label>
      <label className="grid gap-1">Ubicación del portón
        <select name="gateLocation" className="h-10 border border-input bg-card px-2">
          <option>Frente</option>
          <option>Lateral</option>
          <option>Fondo</option>
        </select>
      </label>
      <label className="grid gap-1">Observaciones<Textarea name="notes" /></label>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>Solicitar presupuesto</Button>
    </form>
  );
}
