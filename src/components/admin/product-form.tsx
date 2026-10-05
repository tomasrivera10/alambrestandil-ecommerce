"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct } from "@/features/products/actions";

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    categoryId: string;
    shortDescription: string;
    technicalDescription: string;
    brand: string | null;
    salesUnit: string;
    priceVisibility: string;
    price: number | null;
    ctaType: string;
    status: string;
    featured: boolean;
    uses: string[];
    seoTitle: string | null;
    seoDescription: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const id = await saveProduct({
            id: product?.id,
            name: String(form.get("name")),
            slug: String(form.get("slug")),
            sku: String(form.get("sku") || ""),
            categoryId: String(form.get("categoryId")),
            shortDescription: String(form.get("shortDescription")),
            technicalDescription: String(form.get("technicalDescription")),
            brand: String(form.get("brand") || ""),
            salesUnit: String(form.get("salesUnit")) as "UNIDAD",
            priceVisibility: String(form.get("priceVisibility")) as "PUBLIC",
            price: String(form.get("price") || ""),
            ctaType: String(form.get("ctaType")) as "ADD_TO_ORDER",
            status: String(form.get("status")) as "ACTIVE",
            featured: form.get("featured") === "on",
            uses: String(form.get("uses") || ""),
            seoTitle: String(form.get("seoTitle") || ""),
            seoDescription: String(form.get("seoDescription") || ""),
          });
          router.push(`/admin/productos/${id}`);
          router.refresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
        }
      }}
    >
      <label className="grid gap-1">Nombre<Input name="name" required defaultValue={product?.name} /></label>
      <label className="grid gap-1">Slug<Input name="slug" required defaultValue={product?.slug} /></label>
      <label className="grid gap-1">SKU<Input name="sku" defaultValue={product?.sku ?? ""} /></label>
      <label className="grid gap-1">Categoría
        <select name="categoryId" defaultValue={product?.categoryId} className="h-10 border border-input bg-card px-2">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">Descripción corta<Textarea name="shortDescription" required defaultValue={product?.shortDescription} /></label>
      <label className="grid gap-1">Descripción técnica<Textarea name="technicalDescription" required defaultValue={product?.technicalDescription} /></label>
      <label className="grid gap-1">Marca<Input name="brand" defaultValue={product?.brand ?? ""} /></label>
      <label className="grid gap-1">Unidad
        <select name="salesUnit" defaultValue={product?.salesUnit ?? "UNIDAD"} className="h-10 border border-input bg-card px-2">
          {["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"].map((unit) => (
            <option key={unit}>{unit}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">Precio
        <select name="priceVisibility" defaultValue={product?.priceVisibility ?? "HIDDEN"} className="h-10 border border-input bg-card px-2">
          <option value="PUBLIC">Público</option>
          <option value="HIDDEN">Consultar</option>
          <option value="FROM">Desde</option>
        </select>
      </label>
      <label className="grid gap-1">Importe<Input name="price" defaultValue={product?.price ?? ""} /></label>
      <label className="grid gap-1">Acción
        <select name="ctaType" defaultValue={product?.ctaType ?? "ADD_TO_ORDER"} className="h-10 border border-input bg-card px-2">
          <option value="ADD_TO_ORDER">Agregar al pedido</option>
          <option value="REQUEST_QUOTE">Pedir presupuesto</option>
          <option value="CHECK_AVAILABILITY">Consultar disponibilidad</option>
          <option value="WHATSAPP">Consultar por WhatsApp</option>
          <option value="BUILD_ORDER">Armar mi pedido</option>
        </select>
      </label>
      <label className="grid gap-1">Estado
        <select name="status" defaultValue={product?.status ?? "ACTIVE"} className="h-10 border border-input bg-card px-2">
          <option value="DRAFT">Borrador</option>
          <option value="ACTIVE">Activo</option>
          <option value="ARCHIVED">Archivado</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="featured" defaultChecked={product?.featured} />
        Destacado
      </label>
      <label className="grid gap-1">Usos, separados por coma<Input name="uses" defaultValue={product?.uses.join(", ") ?? ""} /></label>
      <label className="grid gap-1">SEO título<Input name="seoTitle" defaultValue={product?.seoTitle ?? ""} /></label>
      <label className="grid gap-1">SEO descripción<Input name="seoDescription" defaultValue={product?.seoDescription ?? ""} /></label>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Button type="submit">Guardar</Button>
    </form>
  );
}
