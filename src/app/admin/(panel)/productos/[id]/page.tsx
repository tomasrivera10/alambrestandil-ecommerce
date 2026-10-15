/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */
import { PricingPanel } from "@/components/admin/pricing-panel";
import { Package, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductWorkspace } from "@/components/admin/product-workspace";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/server/db";
import { decimalToNumber } from "@/lib/format";
import { VariantEditor } from "@/components/admin/variant-editor";
import { ImageEditor } from "@/components/admin/image-editor";
import { ProductStock } from "@/components/admin/product-stock";
import { requireArea } from "@/server/rbac";
import Link from "next/link";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ medida?: string }>;
}) {
  await requireArea("products");
  const { id } = await params;
  const { medida } = await searchParams;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { include: { inventory: true }, orderBy: { sku: "asc" } },
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  const { variants, images, category, ...formProduct } = product;

  return (
    <main className="admin-page workspace-page">
      <Link href="/admin/productos" className="admin-back">
        <ArrowLeft size={16} />
        Volver al catálogo
      </Link>
      <div className="admin-product-heading">
        <div className="admin-product-thumb admin-product-thumb-large">
          {images[0] ? (
            /* Product photographs may be from supplier HTTPS sources. */ <img
              src={images[0].url}
              alt={images[0].alt}
            />
          ) : (
            <Package size={38} />
          )}
        </div>
        <div>
          <h1 className="font-heading text-3xl">{product.name}</h1>
          <p className="admin-help">
            {category.name} · {product.brand || "Marca sin confirmar"}
          </p>
        </div>
      </div>
      <div className="workspace-product-summary">
        <span
          className={`workspace-publication ${product.status === "ACTIVE" ? "is-published" : ""}`}
        >
          {product.status === "ACTIVE"
            ? "Publicado"
            : product.status === "DRAFT"
              ? "Borrador"
              : "Archivado"}
        </span>
        <span>
          {variants.filter((variant) => variant.active).length}{" "}
          {variants.filter((variant) => variant.active).length === 1
            ? "presentación activa"
            : "presentaciones activas"}
        </span>
        <span>
          {product.priceVisibility === "HIDDEN"
            ? "Precio público: a consultar"
            : product.priceVisibility === "FROM"
              ? "Precio público: desde"
              : "Precio visible en la tienda"}
        </span>
        {product.status === "ACTIVE" && (
          <Link target="_blank" href={`/productos/${category.slug}/${product.slug}`}>
            Ver en la tienda ↗
          </Link>
        )}
      </div>
      <ProductWorkspace
        data={
          <div>
            <ProductForm
              key={product.updatedAt.toISOString()}
              categories={categories.map((item) => ({ id: item.id, name: item.name }))}
              product={{
                ...formProduct,
                price: decimalToNumber(product.price),
              }}
            />
          </div>
        }
        photos={
          <div>
            <ImageEditor productId={product.id} name={product.name} images={images} />
          </div>
        }
        stock={
          <ProductStock
            variants={variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              unit: variant.salesUnit ?? product.salesUnit,
              onHand: variant.inventory?.onHand ?? 0,
              reserved: variant.inventory?.reserved ?? 0,
              minStock: variant.inventory?.minStock ?? 0,
            }))}
          />
        }
        presentations={
          <div>
            <VariantEditor
              productId={product.id}
              fallbackUnit={product.salesUnit}
              variants={variants.map((v) => ({
                ...v,
                price: decimalToNumber(v.price),
                attributes: v.attributes as Record<string, string>,
              }))}
            />
          </div>
        }
        pricing={
          <section className="admin-section">
            <h2>Proveedores y precios</h2>
            <p className="admin-help">
              Cada medida tiene su costo, objetivo de margen y referencia de mercado.
            </p>
            <nav className="admin-variant-tabs" aria-label="Medida para comparar precios">
              {variants.map((v) => (
                <Link
                  key={v.id}
                  aria-current={(medida ?? variants[0]?.id) === v.id ? "page" : undefined}
                  href={`?medida=${v.id}#precios-producto`}
                >
                  {v.name}
                </Link>
              ))}
            </nav>
            {variants.length ? (
              <PricingPanel
                variantId={variants.find((v) => v.id === medida)?.id ?? variants[0].id}
              />
            ) : (
              <p className="admin-empty-inline">
                Agregá una medida para vincular costos y calcular precios.
              </p>
            )}
          </section>
        }
      />
    </main>
  );
}
