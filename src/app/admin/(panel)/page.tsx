/* eslint-disable @next/next/no-img-element -- Existing local business photography. */
import Link from "next/link";
import { ArrowRight, Package, ClipboardList, ImagePlus, Truck, ShoppingBag } from "lucide-react";
import { prisma } from "@/server/db";
import { can, getSession, requireArea } from "@/server/rbac";
import { countStaleOrders } from "@/server/orders/attention";
import { unitLabel } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getSession();
  const role = session?.user.role;
  await requireArea(role === "STOCK" ? "inventory" : "orders");
  const [fresh, stale, inventory, pendingLists, missingPhotos, review] = await Promise.all([
    can(role, "orders")
      ? prisma.order.count({ where: { status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP"] } } })
      : 0,
    can(role, "orders") ? countStaleOrders() : 0,
    can(role, "inventory")
      ? prisma.inventory.findMany({
          where: { variant: { active: true, product: { status: "ACTIVE" } } },
          include: { variant: { include: { product: true } } },
        })
      : [],
    can(role, "suppliers") ? prisma.supplierPriceList.count({ where: { status: "REVIEW" } }) : 0,
    can(role, "products")
      ? prisma.product.count({ where: { status: "ACTIVE", images: { none: {} } } })
      : 0,
    can(role, "products")
      ? prisma.product.count({
          where: { status: "ACTIVE", variants: { some: { reviewNote: { not: null } } } },
        })
      : 0,
  ]);
  const low = inventory
    .filter(
      (item) =>
        item.onHand - item.reserved <= 0 ||
        (item.minStock > 0 && item.onHand - item.reserved <= item.minStock),
    )
    .sort((a, b) => a.onHand - a.reserved - (b.onHand - b.reserved));
  const tasks = [
    ...(can(role, "inventory")
      ? [
          {
            href: "/admin/stock?state=low",
            title: "Revisar materiales para reponer",
            detail: "Presentaciones sin disponibilidad o en su mínimo.",
            count: low.length,
            Icon: Package,
          },
        ]
      : []),
    ...(can(role, "orders")
      ? [
          {
            href: "/admin/pedidos?atencion=nuevos",
            title: "Atender pedidos nuevos",
            detail: "Pedidos recibidos por la web o enviados a WhatsApp.",
            count: fresh,
            Icon: ShoppingBag,
          },
          {
            href: "/admin/pedidos?atencion=demorados",
            title: "Retomar pedidos pendientes",
            detail: "Sin actualizar hace más de 48 horas.",
            count: stale,
            Icon: ClipboardList,
          },
        ]
      : []),
    ...(can(role, "products")
      ? [
          {
            href: "/admin/productos?foto=review",
            title: "Verificar datos del catálogo",
            detail: "Productos con medidas que necesitan revisión.",
            count: review,
            Icon: ClipboardList,
          },
          {
            href: "/admin/productos?foto=missing",
            title: "Completar fotos de productos",
            detail: "Materiales publicados que todavía no tienen imagen.",
            count: missingPhotos,
            Icon: ImagePlus,
          },
        ]
      : []),
    ...(can(role, "suppliers")
      ? [
          {
            href: "/admin/proveedores",
            title: "Revisar listas de proveedores",
            detail: "Documentos cargados que esperan aprobación.",
            count: pendingLists,
            Icon: Truck,
          },
        ]
      : []),
  ];
  const pending = tasks.filter((task) => task.count > 0);
  return (
    <main className="admin-page workspace-page">
      <section className="workspace-welcome">
        <div>
          <h1>Tu mesa de trabajo</h1>
          <p>
            Hola, {session?.user.name?.split(" ")[0] ?? "equipo"}. Encontrá lo pendiente y seguí con
            el trabajo del día.
          </p>
          <div className="admin-heading-actions">
            {can(role, "inventory") && (
              <Link href="/admin/stock" className="admin-button">
                Ingresar mercadería
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
            {can(role, "orders") && (
              <Link
                href="/admin/ventas"
                className={can(role, "inventory") ? "admin-button-secondary" : "admin-button"}
              >
                Registrar venta
              </Link>
            )}
          </div>
        </div>
        <img
          src="/images/tandil/rollos.webp"
          alt="Rollos de tejido del catálogo de Alambres Tandil"
        />
      </section>
      <section className="workspace-tasks">
        <div className="workspace-section-heading">
          <h2>Necesita atención</h2>
          <p>
            {pending.length
              ? `${pending.length} tareas con pendientes`
              : "No hay pendientes en tus áreas de trabajo"}
          </p>
        </div>
        <div className="workspace-task-list">
          {(pending.length ? pending : tasks).map(({ href, title, detail, count, Icon }) => (
            <Link key={href} href={href}>
              <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
              <span className={`workspace-task-count ${count ? "has-pending" : ""}`}>{count}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      {can(role, "inventory") && low.length > 0 && (
        <section className="workspace-home-stock">
          <div className="workspace-section-heading">
            <h2>Materiales para reponer</h2>
            <Link href="/admin/stock?state=low">
              Ver todos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul>
            {low.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link href={`/admin/productos/${item.variant.productId}#stock-producto`}>
                  <strong>{item.variant.product.name}</strong>
                  <span>{item.variant.name}</span>
                </Link>
                <p>
                  <strong>
                    {(item.onHand - item.reserved).toLocaleString("es-AR")}{" "}
                    {unitLabel(item.variant.salesUnit ?? item.variant.product.salesUnit)}
                  </strong>
                  <span>disponibles</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
