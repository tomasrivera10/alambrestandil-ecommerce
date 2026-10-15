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
    include: { customer: true },
    take: 30,
    skip: (page - 1) * 30,
  });
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
        <p>{count} pedidos</p>
        {(q || status || attention) && <Link href="/admin/pedidos">Limpiar filtros</Link>}
      </div>
      <div
        className="workspace-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Pedidos, desplazable horizontalmente"
      >
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Localidad</th>
              <th>Recibido</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link className="workspace-inline-link" href={`/admin/pedidos/${order.id}`}>
                    {formatOrderNumber(order.number)}
                  </Link>
                </td>
                <td>
                  {order.customer.name}
                  <p>{order.customer.phone}</p>
                </td>
                <td>
                  <StatusLabel value={order.status} />
                </td>
                <td>{order.locality || "Sin indicar"}</td>
                <td>
                  {order.createdAt.toLocaleDateString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
