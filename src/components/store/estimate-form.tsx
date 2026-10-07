"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEstimateQuote } from "@/features/quotes/actions";

export function EstimateForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="store-form grid gap-4 text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
          const result = await createEstimateQuote(new FormData(event.currentTarget));
          window.open(result.url, "_blank", "noopener,noreferrer");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No pudimos armar el presupuesto.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="grid gap-1">
        Metros lineales
        <Input name="meters" type="number" min={1} required defaultValue={30} />
      </label>
      <label className="grid gap-1">
        Altura en metros
        <Input name="height" type="number" min={0.5} step="0.1" required defaultValue={1.8} />
      </label>
      <label className="grid gap-1">
        Tejido
        <select name="mesh" className="h-10 border border-input bg-card px-2">
          <option value="romboidal">Galvanizado romboidal</option>
          <option value="revestido">Revestido símil ligustrina</option>
          <option value="pvc">PVC</option>
        </select>
      </label>
      <label className="grid gap-1">
        Poste
        <select name="post" className="h-10 border border-input bg-card px-2">
          <option value="olimpico">Olímpico</option>
          <option value="recto">Recto</option>
        </select>
      </label>
      <label className="grid gap-1">
        Portón
        <select name="gate" className="h-10 border border-input bg-card px-2">
          <option value="ninguno">Sin portón</option>
          <option value="economica">Línea económica</option>
          <option value="reforzado">Reforzado</option>
        </select>
      </label>
      <label className="grid gap-1">
        Instalación
        <select name="install" className="h-10 border border-input bg-card px-2">
          <option value="no">Solo materiales</option>
          <option value="si">Con instalación</option>
        </select>
      </label>
      <label className="grid gap-1">
        Nombre
        <Input name="name" autoComplete="name" required />
      </label>
      <label className="grid gap-1">
        Teléfono
        <Input name="phone" type="tel" autoComplete="tel" required />
      </label>
      <label className="grid gap-1">
        Localidad
        <Input name="locality" defaultValue="Tandil" />
      </label>
      <label className="grid gap-1">
        Observaciones
        <Input name="notes" />
      </label>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Armando lista" : "Solicitar cotización"}
      </Button>
    </form>
  );
}
