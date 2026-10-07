"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCategory } from "@/features/products/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
export function CategoryEditor({
  category,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    filterKeys: string[];
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-4 py-4 text-sm sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setMessage("");
        try {
          await saveCategory(form);
          setMessage("Categoría guardada.");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input name="id" type="hidden" value={category?.id || ""} />
      <label className="grid gap-1">
        Nombre
        <Input name="name" required minLength={2} defaultValue={category?.name} />
      </label>
      <label className="grid gap-1">
        Dirección web (slug)
        <Input
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={category?.slug}
        />
      </label>
      <label className="grid gap-1 sm:col-span-2">
        Descripción
        <Textarea name="description" defaultValue={category?.description || ""} />
      </label>
      <label className="grid gap-1">
        Orden
        <Input name="sortOrder" type="number" required defaultValue={category?.sortOrder || 0} />
      </label>
      <label className="grid gap-1">
        Filtros técnicos (separados por coma)
        <Input
          name="filterKeys"
          defaultValue={category?.filterKeys.join(", ") || ""}
          placeholder="altura, calibre, largo"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar categoría"}
        </Button>
        <p role="status">{message}</p>
      </div>
    </form>
  );
}
