import { OrderWorkspaceDetail, orderDate } from "@/components/admin/order-workspace-detail";
import { formatMoney } from "@/lib/format";
import { StatusLabel, statusText } from "@/components/admin/status-label";
import { SectionNav } from "@/components/admin/section-nav";
import { requireArea } from "@/server/rbac";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { staleOrderFilter } from "@/server/orders/attention";
import { prisma } from "@/server/db";
import { formatOrderNumber } from "@/lib/format";
import { OrderStatus, type Prisma } from "@/generated/prisma/client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireArea("orders");
  const params = await searchParams;
  const value = (name: string) =>
    typeof params[name] === "string" ? (params[name] as string) : "";
  const q = value("q").trim(),
    status = value("estado"),
    attention = value("atencion");
  const orderNumber = Number(q.replace(/^AT-/i, ""));
  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { customer: { name: { contains: q, mode: "insensitive" } } },
            { customer: { phone: { contains: q } } },
            ...(Number.isSafeInteger(orderNumber) && orderNumber > 0
              ? [{ number: orderNumber }]
              : []),
          ],
        }
      : {}),
    AND: [
      ...(Object.values(OrderStatus).includes(status as OrderStatus)
        ? [{ status: status as OrderStatus }]
        : []),
      ...(attention === "nuevos"
        ? [{ status: { in: [OrderStatus.NUEVO, OrderStatus.ENVIADO_A_WHATSAPP] } }]
        : attention === "demorados"
          ? [staleOrderFilter()]
          : []),
    ],
  };
  const count = await prisma.order.count({ where });
  const pages = Math.max(1, Math.ceil(count / 30));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(value("pagina"))) || 1));
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: true,
      history: { orderBy: { createdAt: "desc" }, include: { user: true } },
    },
    take: 30,
    skip: (page - 1) * 30,
  });
  const [groups, staleCount] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.count({ where: staleOrderFilter() }),
  ]);
  const totalFor = (statuses: OrderStatus[]) =>
    groups
      .filter((group) => statuses.includes(group.status))
      .reduce((sum, group) => sum + group._count, 0);
  const pageUrl = (n: number) =>
    `/admin/pedidos?${new URLSearchParams({ q, estado: status, atencion: attention, pagina: String(n) })}`;
  return (
    <main className="admin-page workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Pedidos</h1>
          <p>Atendé consultas, prepará entregas y seguí cada pedido.</p>
        </div>
        <Link href="/admin/ventas" className="admin-button">
          <Plus size={17} aria-hidden="true" />
          Registrar venta
        </Link>
      </div>
      <SectionNav kind="orders" />
      <nav className="order-queues" aria-label="Resumen de todos los pedidos">
        <Link href="/admin/pedidos?atencion=nuevos">
          Por atender{" "}
          <strong>{totalFor([OrderStatus.NUEVO, OrderStatus.ENVIADO_A_WHATSAPP])}</strong>
        </Link>
        <Link href="/admin/pedidos?estado=PREPARANDO">
          En preparación <strong>{totalFor([OrderStatus.PREPARANDO])}</strong>
        </Link>
        <Link href="/admin/pedidos?estado=LISTO">
          Listos para entregar <strong>{totalFor([OrderStatus.LISTO])}</strong>
        </Link>
        <Link href="/admin/pedidos?atencion=demorados">
          Sin actualizar en 48 h <strong>{staleCount}</strong>
        </Link>
      </nav>
      <form className="workspace-filterbar">
        <label className="workspace-search">
          <span>Buscar pedido</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input name="q" defaultValue={q} placeholder="Número, cliente o teléfono" />
          </div>
        </label>
        <label>
          <span>Estado</span>
          <select name="estado" defaultValue={status}>
            <option value="">Todos los estados</option>
            {Object.values(OrderStatus).map((item) => (
              <option key={item} value={item}>
                {statusText(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Atención</span>
          <select name="atencion" defaultValue={attention}>
            <option value="">Todos los pedidos</option>
            <option value="nuevos">Nuevos por atender</option>
            <option value="demorados">Sin actualizar hace 48 h</option>
          </select>
        </label>
        <button type="submit" className="admin-button-secondary">
          Buscar
        </button>
      </form>
      <div className="workspace-results">
        <p>
          {count} {count === 1 ? "pedido" : "pedidos"} · Abrí un pedido para ver todo y gestionarlo.
        </p>
        {(q || status || attention) && <Link href="/admin/pedidos">Limpiar filtros</Link>}
      </div>
      <div className="order-worklist">
        {orders.map((order) => (
          <details className="order-workitem" key={order.id}>
            <summary>
              <span>
                <strong>{formatOrderNumber(order.number)}</strong>
                <small>{orderDate(order.createdAt)}</small>
              </span>
              <span>
                <strong>{order.customer.name}</strong>
                <small>{order.customer.phone}</small>
              </span>
              <span>
                <StatusLabel value={order.status} />
                <small>
                  {order.fulfillment === "ENVIO" ? "Envío" : "Retiro"} ·{" "}
                  {order.locality || "Sin localidad"}
                </small>
              </span>
              <span>
                <strong>
                  {order.estimatedTotal == null
                    ? "A cotizar"
                    : formatMoney(Number(order.estimatedTotal))}
                </strong>
                <small>
                  {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                  {order.items.some((item) => item.lineTotal == null) &&
                  order.estimatedTotal != null
                    ? " · Importe parcial"
                    : ""}
                </small>
              </span>
              <span className="order-expand">Ver y gestionar</span>
            </summary>
            <OrderWorkspaceDetail order={order} />
            <Link className="order-permalink" href={`/admin/pedidos/${order.id}`}>
              Abrir página del pedido
            </Link>
          </details>
        ))}
      </div>
      {!orders.length && (
        <div className="workspace-empty">
          <h2>
            {q || status || attention
              ? "No hay pedidos con estos filtros"
              : "Todavía no hay pedidos"}
          </h2>
          <p>
            {q || status || attention
              ? "Probá con otro cliente, número o estado."
              : "Los pedidos de la tienda aparecerán acá. Las ventas del local se registran desde Ventas de mostrador."}
          </p>
          {(q || status || attention) && (
            <Link href="/admin/pedidos" className="admin-button-secondary">
              Ver todos los pedidos
            </Link>
          )}
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Páginas de pedidos" className="workspace-pagination">
          {page > 1 && <Link href={pageUrl(page - 1)}>Anterior</Link>}
          <span>
            Página {page} de {pages}
          </span>
          {page < pages && <Link href={pageUrl(page + 1)}>Siguiente</Link>}
        </nav>
      )}
    </main>
  );
}
