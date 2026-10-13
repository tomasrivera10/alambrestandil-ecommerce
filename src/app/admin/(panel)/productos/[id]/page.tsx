/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */
import { PricingPanel } from "@/components/admin/pricing-panel";
import { Package, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
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
    <div className="max-w-5xl">
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
      <nav className="admin-section-nav" aria-label="Secciones del producto">
        <a href="#datos-producto">Datos</a>
        <a href="#fotos-producto">Fotos</a>
        <a href="#medidas-producto">Medidas</a>
        <a href="#stock-producto">Stock</a>
        <a href="#precios-producto">Proveedores y precios</a>
      </nav>
      <a
        className="mt-2 inline-block text-sm font-medium underline underline-offset-4"
        href="#stock-producto"
      >
        Ver y ajustar stock por medida
      </a>
      {product.status === "ACTIVE" && (
        <Link
          className="ml-4 mt-2 inline-block text-sm underline"
          target="_blank"
          href={`/productos/${category.slug}/${product.slug}`}
        >
          Ver en la web
        </Link>
      )}
      <div id="datos-producto" className="mt-6 admin-anchor">
        <ProductForm
          key={product.updatedAt.toISOString()}
          categories={categories.map((item) => ({ id: item.id, name: item.name }))}
          product={{
            ...formProduct,
            price: decimalToNumber(product.price),
          }}
        />
      </div>
      <div id="fotos-producto" className="admin-anchor">
        <ImageEditor productId={product.id} name={product.name} images={images} />
      </div>
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

      <div id="medidas-producto" className="admin-anchor">
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
      <section id="precios-producto" className="admin-section admin-anchor">
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
          <PricingPanel variantId={variants.find((v) => v.id === medida)?.id ?? variants[0].id} />
        ) : (
          <p className="admin-empty-inline">
            Agregá una medida para vincular costos y calcular precios.
          </p>
        )}
      </section>
    </div>
  );
}
