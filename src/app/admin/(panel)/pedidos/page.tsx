import { StatusLabel } from "@/components/admin/status-label";
import { SectionNav } from "@/components/admin/section-nav";
import { requireArea } from "@/server/rbac";
import Link from "next/link";
import { prisma, safeQuery } from "@/server/db";
import { formatOrderNumber } from "@/lib/format";

export default async function OrdersPage() {
  await requireArea("orders");
  const orders = await safeQuery(
    () =>
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { customer: true },
        take: 100,
      }),
    [],
  );

  return (
    <div className="admin-page">
      <SectionNav kind="orders" />
      <div className="admin-page-heading">
        <div>
          <h1>Pedidos</h1>
          <p>Abrí un pedido para atenderlo, preparar la entrega y consultar sus reservas.</p>
        </div>
        <Link href="/admin/ventas" className="admin-button">
          Registrar venta de mostrador
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="mt-6 text-sm">Todavía no hay pedidos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table mt-6">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="py-2">Número</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Localidad</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border">
                  <td className="py-2 font-mono">
                    <Link href={`/admin/pedidos/${order.id}`} className="underline">
                      {formatOrderNumber(order.number)}
                    </Link>
                  </td>
                  <td>{order.customer.name}</td>
                  <td>
                    <StatusLabel value={order.status} />
                  </td>
                  <td>{order.locality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
