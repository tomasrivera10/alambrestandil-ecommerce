"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct } from "@/server/products/actions";
import { unitLabel } from "@/lib/format";
import { toast } from "sonner";

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
    documentationUrl: string | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [priceVisibility, setPriceVisibility] = useState(product?.priceVisibility ?? "HIDDEN");
  const [price, setPrice] = useState(product?.price?.toString().replace(".", ",") ?? "");

  return (
    <form
      className="admin-form admin-product-form text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        setSaved(false);
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
            documentationUrl: String(form.get("documentationUrl") || ""),
          });
          router.push(`/admin/productos/${id}`);
          router.refresh();
          setSaved(true);
          toast.success("Producto guardado.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="admin-form-section">
        <h2>Información del producto</h2>
        <p>Identificá el producto tal como aparece en la tienda.</p>
        <div className="admin-form-grid">
          <label className="grid gap-1 admin-span-all">
            Nombre
            <Input
              name="name"
              required
              minLength={2}
              value={name}
              placeholder="Ej. Tejido romboidal galvanizado"
              onChange={(e) => {
                setName(e.target.value);
                if (!product && !slugEdited) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="grid gap-1">
            Categoría
            <select
              name="categoryId"
              defaultValue={product?.categoryId}
              className="admin-product-select"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 admin-span-all">
            Descripción corta
            <Textarea
              name="shortDescription"
              minLength={8}
              required
              defaultValue={product?.shortDescription}
            />
          </label>
          <label className="grid gap-1">
            Marca
            <Input name="brand" defaultValue={product?.brand ?? ""} />
          </label>
          <label className="grid gap-1">
            Unidad
            <select
              name="salesUnit"
              defaultValue={product?.salesUnit ?? "UNIDAD"}
              className="admin-product-select"
            >
              {["UNIDAD", "METRO", "ROLLO", "KG", "PAQUETE", "PANEL", "JUEGO"].map((unit) => (
                <option key={unit} value={unit}>
                  {unitLabel(unit, 1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="admin-form-section">
        <h2>Precio y publicación</h2>
        <p>Definí qué verá el cliente. Las medidas pueden tener precios propios.</p>
        <div className="admin-product-pricing">
          <label className="grid gap-1">
            Cómo se muestra el precio
            <select
              name="priceVisibility"
              value={priceVisibility}
              onChange={(event) => setPriceVisibility(event.target.value)}
              className="admin-product-select"
            >
              <option value="PUBLIC">Mostrar precio</option>
              <option value="FROM">Mostrar «Desde»</option>
              <option value="HIDDEN">Pedir precio</option>
            </select>
          </label>
          {priceVisibility === "HIDDEN" ? (
            <>
              <input type="hidden" name="price" value={price} />
              <p className="admin-product-price-note">El cliente verá “Consultar precio”. No se mostrará ningún importe.</p>
            </>
          ) : (
            <label className="admin-product-price-field">
              <span>{priceVisibility === "FROM" ? "Precio desde" : "Precio de venta"}</span>
              <span className="admin-product-price-control">
                <span aria-hidden="true">$</span>
                <Input
                  name="price"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  aria-describedby="admin-price-help"
                />
                <span aria-hidden="true">ARS</span>
              </span>
              <span id="admin-price-help" className="admin-product-field-help">Ingresá el importe con coma para los centavos.</span>
            </label>
          )}
          <label className="grid gap-1">
            Publicación
            <select
              name="status"
              defaultValue={product?.status ?? "DRAFT"}
              className="admin-product-select"
            >
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </label>
        </div>
      </section>
      <details className="admin-disclosure">
        <summary>Datos técnicos y opciones avanzadas</summary>
        <div className="admin-form-grid">
          <label className="grid gap-1">
            Dirección web (slug)
            <Input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="nombre-del-producto"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
            />
          </label>
          <label className="grid gap-1">
            SKU
            <Input name="sku" defaultValue={product?.sku ?? ""} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            Descripción técnica
            <Textarea
              name="technicalDescription"
              minLength={0}
              defaultValue={product?.technicalDescription}
            />
          </label>
          <label className="grid gap-1">
            Acción
            <select
              name="ctaType"
              defaultValue={product?.ctaType ?? "ADD_TO_ORDER"}
              className="h-10 border border-input bg-card px-2"
            >
              <option value="ADD_TO_ORDER">Agregar al pedido</option>
              <option value="REQUEST_QUOTE">Pedir presupuesto</option>
              <option value="CHECK_AVAILABILITY">Consultar disponibilidad</option>
              <option value="WHATSAPP">Consultar por WhatsApp</option>
              <option value="BUILD_ORDER">Armar mi pedido</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} />
            Destacado
          </label>
          <label className="grid gap-1">
            Usos, separados por coma
            <Input name="uses" defaultValue={product?.uses.join(", ") ?? ""} />
          </label>
          <label className="grid gap-1">
            SEO título
            <Input name="seoTitle" defaultValue={product?.seoTitle ?? ""} />
          </label>
          <label className="grid gap-1">
            SEO descripción
            <Input name="seoDescription" defaultValue={product?.seoDescription ?? ""} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            Ficha técnica (URL)
            <Input
              name="documentationUrl"
              type="url"
              defaultValue={product?.documentationUrl ?? ""}
            />
          </label>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar producto"}
        </Button>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : saved ? (
          <p role="status">Producto guardado.</p>
        ) : (
          <p className="text-muted-foreground">
            Guardá el producto y continuá con fotos, medidas y stock.
          </p>
        )}
      </div>
    </form>
  );
}
