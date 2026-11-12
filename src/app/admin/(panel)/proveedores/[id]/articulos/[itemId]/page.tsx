import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { updateSupplierItem } from "@/server/suppliers/actions";
import { COMPANY_STOCK_SOURCE } from "@/server/suppliers/review-plan";
import { grossMargin } from "@/features/pricing/calculation";
import { SupplierItemTabs } from "@/components/admin/supplier-item-tabs";
import { VariantSelect } from "@/components/admin/variant-select";
import { ActionForm } from "@/components/admin/action-form";
import { PricingPanel } from "@/components/admin/pricing-panel";
import { PriceDisplay } from "@/components/admin/price-display";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import styles from "@/components/admin/supplier-item-detail.module.css";

export default async function SupplierItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  await requireArea("suppliers");
  const { id, itemId } = await params;
  const item = await prisma.supplierItem.findFirst({
    where: { id: itemId, supplierId: id },
    include: { supplier: true, variant: { include: { product: true, inventory: true } } },
  });
  if (!item) notFound();
  const variants = await prisma.productVariant.findMany({
    where: { active: true, sourceReference: { startsWith: COMPANY_STOCK_SOURCE } },
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
    orderBy: { product: { name: "asc" } },
  });
  const variant = item.variant;
  const cost = item.listPrice == null ? null : Number(item.listPrice);
  const rawPrice = variant?.price ?? variant?.product.price;
  const price = rawPrice == null ? null : Number(rawPrice);
  const margin = item.purchased ? grossMargin(cost, price) : null;
  const canPrice = !!(
    variant?.active &&
    item.purchased &&
    variant.sourceReference?.startsWith(COMPANY_STOCK_SOURCE)
  );
  const inventory = variant?.inventory;
  const hidden = variant?.product.priceVisibility === "HIDDEN";
  return (
    <main className={`admin-page ${styles.detail}`}>
      <div className={styles.context}>
        <Breadcrumb aria-label="Ruta del artículo">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin/proveedores" />}>
                Proveedores
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/admin/proveedores/${id}`} />}>
                {item.supplier.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.code || "Artículo"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className={styles.heading}>
          <div>
            <h1>{item.name}</h1>
            <p>
              {item.supplier.name} · Código {item.code} · {item.unit || "Unidad sin aclarar"}
              {variant ? ` · SKU ${variant.sku}` : ""}
            </p>
          </div>
          <span className="admin-badge">
            {!variant
              ? "Sin vincular"
              : !item.purchased
                ? "Vinculado · No comprado"
                : canPrice
                  ? "Vinculado"
                  : "Revisar vinculación"}
          </span>
        </header>
      </div>
      <section className={styles.metrics} aria-label="Indicadores comerciales">
        <PriceDisplay
          kind="cost"
          label="Costo de compra"
          value={cost}
          note="Importe literal de lista"
        />
        <PriceDisplay
          label={hidden ? "Precio de venta actual" : "Precio de venta publicado"}
          value={price}
          note={
            hidden
              ? "En ecommerce: a consultar"
              : variant
                ? "Precio vigente de la presentación"
                : "Vinculá un producto interno"
          }
        />
        <div className={styles.margin}>
          <span>Margen bruto actual</span>
          <strong>
            {margin == null
              ? "Sin datos"
              : `${margin.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`}
          </strong>
          <small>{item.purchased ? "(Venta − costo) ÷ venta" : "Artículo no comprado"}</small>
        </div>
      </section>
      <SupplierItemTabs
        summary={
          <section className={styles.section}>
            <h2>Datos del artículo</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Proveedor</dt>
                <dd>{item.supplier.name}</dd>
              </div>
              <div>
                <dt>Artículo de origen</dt>
                <dd>{item.name}</dd>
              </div>
              <div>
                <dt>Código y unidad del proveedor</dt>
                <dd>
                  {item.code} · {item.unit || "Sin aclarar"}
                </dd>
              </div>
              <div>
                <dt>Última actualización del artículo</dt>
                <dd>
                  {item.updatedAt.toLocaleDateString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </dd>
              </div>
              <div>
                <dt>Compra</dt>
                <dd>{item.purchased ? "Compramos este artículo" : "No comprado"}</dd>
              </div>
              <div>
                <dt>Presentación interna</dt>
                <dd>
                  {variant
                    ? `${variant.product.name} · ${variant.name} · ${variant.salesUnit ?? variant.product.salesUnit}`
                    : "Sin vincular. Asociá la presentación en Vinculación."}
                </dd>
              </div>
            </dl>
            {item.supplier.notes && <p className={styles.notes}>{item.supplier.notes}</p>}
            {variant && (
              <div className={styles.stock}>
                <h2>Disponibilidad</h2>
                <p>
                  {inventory
                    ? `Disponible: ${inventory.onHand - inventory.reserved} · Reservado: ${inventory.reserved} · Mínimo: ${inventory.minStock}${inventory.onHand - inventory.reserved <= inventory.minStock ? " · Reponer" : ""}`
                    : "Sin registro de inventario"}
                </p>
                <Link className="admin-back" href={`/admin/productos/${variant.productId}`}>
                  Ver producto y stock →
                </Link>
              </div>
            )}
            <p className="admin-help">
              El costo se conserva tal como figura en la lista. Revisá IVA, descuentos y
              presentación antes de compararlo con la venta.
            </p>
          </section>
        }
        pricing={
          canPrice ? (
            <PricingPanel variantId={variant!.id} supplierItemId={item.id} focused />
          ) : (
            <p className="admin-empty-inline">
              Para gestionar precios, vinculá una presentación activa de la hoja Stock y marcá que
              compramos este artículo en Vinculación.
            </p>
          )
        }
        linking={
          <section className={styles.section}>
            <h2>Vincular presentación interna</h2>
            <p className="admin-help">
              Origen: {item.name} · {item.code} · {item.unit || "Unidad sin aclarar"}. Compará
              producto, medidas y unidad con la presentación interna.
            </p>
            <ActionForm action={updateSupplierItem} className={styles.linkForm}>
              <input hidden name="id" value={item.id} readOnly />
              <VariantSelect
                options={variants.map((v) => ({
                  id: v.id,
                  name: `${v.product.name} · ${v.name} (${v.sku})`,
                  unit: v.salesUnit ?? v.product.salesUnit,
                  image: v.product.images[0]?.url,
                }))}
                defaultValue={item.variantId ?? ""}
              />
              <label className="admin-check">
                <input name="purchased" type="checkbox" defaultChecked={item.purchased} /> Compramos
                este artículo
              </label>
              <label className="admin-check">
                <input type="checkbox" name="exact" /> Confirmo mismo producto y unidad
              </label>
              <button className="admin-button-secondary">Guardar vínculo</button>
            </ActionForm>
          </section>
        }
      />
    </main>
  );
}
