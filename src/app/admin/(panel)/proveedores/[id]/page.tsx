import { SupplierItemsList } from "@/components/admin/supplier-items-list";
import { loadSupplierItems } from "@/server/suppliers/items";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { SupplierUpload } from "@/components/admin/supplier-upload";
import { SupplierReview } from "@/components/admin/supplier-review";
import { supplierReviewRevision } from "@/server/suppliers/review-revision";
import type { ImportedRow } from "@/server/suppliers/parse";
import { buildSupplierReviewPlan, COMPANY_STOCK_SOURCE } from "@/server/suppliers/review-plan";
export const maxDuration = 120;
export default async function SupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; articulo?: string }>;
}) {
  await requireArea("suppliers");
  const { id } = await params;
  const { q = "", articulo } = await searchParams;
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
  if (articulo) {
    const item = await prisma.supplierItem.findFirst({
      where: { id: articulo, supplierId: id },
      select: { id: true },
    });
    if (!item) notFound();
    redirect(`/admin/proveedores/${id}/articulos/${item.id}`);
  }
  const [initial, variants, previousItems] = await Promise.all([
    loadSupplierItems({ supplierId: id, query: q }),
    prisma.productVariant.findMany({
      where: { active: true, sourceReference: { startsWith: COMPANY_STOCK_SOURCE } },
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.supplierItem.findMany({
      where: { supplierId: id },
      select: { code: true, name: true, unit: true, variantId: true, listPrice: true },
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
      <details
        className="admin-disclosure"
        open={supplier.lists.some((list) => list.status === "REVIEW")}
      >
        <summary>Cargar y revisar listas de precios</summary>
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
                  key={supplierReviewRevision(list.rows)}
                  revision={supplierReviewRevision(list.rows)}
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
                    previousItems.map((item) => ({ ...item, listPrice: item.listPrice == null ? null : Number(item.listPrice) })),
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
      </details>
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Artículos y precios de venta</h2>
            <p>Vinculá cada artículo con su presentación exacta en la tienda.</p>
          </div>
        </div>
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
        <SupplierItemsList
          key={JSON.stringify([id, q, initial])}
          supplierId={id}
          query={q}
          initial={initial}
        />
      </section>
    </main>
  );
}
