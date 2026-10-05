import Link from "next/link";
import { prisma, safeQuery } from "@/lib/db";
import { formatOrderNumber } from "@/lib/format";

export default async function OrdersPage() {
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
    <div>
      <h1 className="font-heading text-3xl">Pedidos</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-sm">Todavía no hay pedidos.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
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
                <td>{order.status}</td>
                <td>{order.locality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
