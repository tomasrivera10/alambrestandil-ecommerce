import { VariantSelect } from "@/components/admin/variant-select";
/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { updateSupplierItem } from "@/server/suppliers/actions";
import { SupplierUpload } from "@/components/admin/supplier-upload";
import { SupplierReview } from "@/components/admin/supplier-review";
import { PricingPanel } from "@/components/admin/pricing-panel";
import { PriceDisplay } from "@/components/admin/price-display";
import { ActionForm } from "@/components/admin/action-form";
import type { ImportedRow } from "@/server/suppliers/parse";
import { buildSupplierReviewPlan, COMPANY_STOCK_SOURCE } from "@/server/suppliers/review-plan";
export const maxDuration = 60;
export default async function SupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; pagina?: string; articulo?: string }>;
}) {
  await requireArea("suppliers");
  const { id } = await params;
  const { q = "", pagina = "1", articulo } = await searchParams;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      lists: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, filename: true, status: true, rows: true, notes: true },
      },
      _count: { select: { items: true } },
    },
  });
  if (!supplier) notFound();
  const where = {
    supplierId: id,
    ...(articulo ? { id: articulo } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const count = await prisma.supplierItem.count({ where });
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(pagina)) || 1));
  const [items, variants, previousItems] = await Promise.all([
    prisma.supplierItem.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * 20,
      take: 20,
      include: {
        variant: {
          include: {
            inventory: true,
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
        },
      },
    }),
    prisma.productVariant.findMany({
      where: { active: true, sourceReference: { startsWith: COMPANY_STOCK_SOURCE } },
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.supplierItem.findMany({
      where: { supplierId: id },
      select: { code: true, name: true, unit: true, variantId: true },
    }),
  ]);
  const options = variants.map((v) => ({
    id: v.id,
    name: `${v.product.name} · ${v.name} (${v.sku})`,
    unit: v.salesUnit ?? v.product.salesUnit,
    image: v.product.images[0]?.url,
  }));
  return (
    <main className="admin-page">
      <Link className="admin-back" href="/admin/proveedores">
        <ArrowLeft size={16} /> Proveedores
      </Link>
      <div className="admin-page-heading">
        <div>
          <h1>{supplier.name}</h1>
          <p>De la lista del proveedor al precio de venta, con cada importe a la vista.</p>
        </div>
        <span className="admin-badge">{supplier._count.items} artículos</span>
      </div>
      <ol className="admin-process">
        <li>
          <strong>Subí la lista</strong>
          <span>PDF, Excel o Word</span>
        </li>
        <li>
          <strong>Revisá los costos</strong>
          <span>Compará con el original</span>
        </li>
        <li>
          <strong>Vinculá la medida</strong>
          <span>El mismo producto y unidad</span>
        </li>
        <li>
          <strong>Definí el precio</strong>
          <span>Costo, margen y mercado</span>
        </li>
      </ol>
      <SupplierUpload supplierId={id} />
      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Listas de precios</h2>
          <span className="admin-help">Últimas 8 listas</span>
        </div>
        {supplier.lists.length ? (
          supplier.lists.map((list) => (
            <div id={`lista-${list.id}`} key={list.id} className="admin-anchor">
              <SupplierReview
                id={list.id}
                filename={list.filename}
                status={list.status}
                rows={list.rows as ImportedRow[]}
                notes={list.notes}
                variants={options}
                plan={buildSupplierReviewPlan(
                  list.rows as ImportedRow[],
                  variants.map((v) => ({
                    id: v.id,
                    name: v.name,
                    unit: v.salesUnit ?? v.product.salesUnit,
                    sourceReference: v.sourceReference,
                  })),
                  previousItems,
                )}
              />
            </div>
          ))
        ) : (
          <p className="admin-empty-inline">
            Subí la primera lista para empezar a comparar costos.
          </p>
        )}
      </section>
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Artículos y precios de venta</h2>
            <p>Vinculá cada artículo con su presentación exacta en la tienda.</p>
          </div>
        </div>
        {articulo && (
          <Link className="admin-back" href={`/admin/proveedores/${id}`}>
            Ver todos los artículos del proveedor
          </Link>
        )}
        <form className="admin-toolbar">
          <label className="grow">
            Buscar artículo
            <input
              name="q"
              className="admin-input"
              defaultValue={q}
              placeholder="Nombre o código del proveedor"
            />
          </label>
          <button className="admin-button-secondary">Buscar</button>
        </form>
        <div className="admin-supplier-items">
          {items.map((item) => (
            <article
              key={item.id}
              id={`item-${item.id}`}
              className="admin-supplier-item admin-anchor"
            >
              <div className="admin-item-heading">
                <div className="admin-product-thumb">
                  {item.variant?.product.images[0] ? (
                    /* Product photographs may be from supplier HTTPS sources. */ <img
                      src={item.variant.product.images[0].url}
                      alt={item.variant.product.images[0].alt}
                    />
                  ) : (
                    <Package size={28} />
                  )}
                </div>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.code} · {item.unit || "Unidad sin aclarar"} · lista actualizada{" "}
                    {item.updatedAt.toLocaleDateString("es-AR")}
                  </p>
                  {item.variant && (
                    <Link
                      className="admin-back"
                      href={`/admin/productos/${item.variant.productId}`}
                    >
                      Ver producto y stock
                    </Link>
                  )}
                </div>
                <PriceDisplay
                  kind="cost"
                  label="Costo literal de lista"
                  value={item.listPrice == null ? null : Number(item.listPrice)}
                />
              </div>
              <details className="admin-disclosure" open={!item.variantId}>
                <summary>
                  {item.variantId
                    ? "Cambiar vínculo o artículo comprado"
                    : "Vincular con una medida de la tienda"}
                </summary>
                <ActionForm action={updateSupplierItem} className="admin-inline-form">
                  <input hidden name="id" value={item.id} readOnly />
                  <VariantSelect options={options} defaultValue={item.variantId ?? ""} />
                  <label className="admin-check">
                    <input name="purchased" type="checkbox" defaultChecked={item.purchased} />{" "}
                    Compramos este artículo
                  </label>
                  <label className="admin-check">
                    <input type="checkbox" name="exact" /> Confirmo mismo producto y unidad
                  </label>
                  <button className="admin-button-secondary">Guardar vínculo</button>
                </ActionForm>
              </details>
              {item.variantId &&
              item.purchased &&
              item.variant?.sourceReference?.startsWith(COMPANY_STOCK_SOURCE) ? (
                <details className="admin-disclosure">
                  <summary>Comparar costo, margen y precio de venta</summary>
                  <PricingPanel variantId={item.variantId} supplierItemId={item.id} />
                </details>
              ) : (
                <p className="admin-help">
                  La guía de precio aparece al marcar este artículo como comprado y vincularlo con
                  una medida de la hoja Stock.
                </p>
              )}
              {item.variant?.inventory &&
                item.variant.inventory.onHand - item.variant.inventory.reserved <=
                  item.variant.inventory.minStock && (
                  <p className="admin-notice">
                    Reponer · disponible:{" "}
                    {item.variant.inventory.onHand - item.variant.inventory.reserved} · mínimo:{" "}
                    {item.variant.inventory.minStock}
                  </p>
                )}
            </article>
          ))}
        </div>
        {!items.length && (
          <p className="admin-empty-inline">No hay artículos para esta búsqueda.</p>
        )}
        <nav aria-label="Páginas de artículos" className="admin-pagination">
          <span>
            {count} artículos · página {page} de {pages}
          </span>
          {page > 1 && (
            <Link href={`?q=${encodeURIComponent(q)}&pagina=${page - 1}`}>Anterior</Link>
          )}
          {page < pages && (
            <Link href={`?q=${encodeURIComponent(q)}&pagina=${page + 1}`}>Siguiente</Link>
          )}
        </nav>
      </section>
    </main>
  );
}
