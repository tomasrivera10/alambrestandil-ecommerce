import Link from "next/link";
import { prisma, safeQuery } from "@/lib/db";
import { countStaleOrders } from "@/features/orders/attention";
import { formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const [fresh, waiting, confirmed, low, recentCustomers] = await Promise.all([
    safeQuery(() => prisma.order.count({ where: { status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP"] } } }), 0),
    safeQuery(() => prisma.order.count({ where: { status: { in: ["CONTACTADO", "COTIZADO"] } } }), 0),
    safeQuery(() => prisma.order.count({ where: { status: "CONFIRMADO" } }), 0),
    safeQuery(
      () =>
        prisma.inventory.findMany({
          where: { onHand: { lte: 5 } },
          include: { variant: { include: { product: true } } },
          take: 8,
        }),
      [],
    ),
    safeQuery(
      () => prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      [],
    ),
  ]);

  const stale = await safeQuery(() => countStaleOrders(), 0);
  const critical = low.filter((item) => item.onHand - item.reserved <= item.minStock);

  const sales = await safeQuery(
    () =>
      prisma.order.aggregate({
        where: { status: { in: ["CONFIRMADO", "PREPARANDO", "LISTO", "ENTREGADO"] } },
        _sum: { estimatedTotal: true },
      }),
    { _sum: { estimatedTotal: null } },
  );

  return (
    <div>
      <h1 className="font-heading text-3xl">Requiere atención</h1>
      <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
        <li className="py-3">{fresh} pedidos nuevos</li>
        <li className="py-3">{critical.length} productos con stock crítico</li>
        <li className="py-3">{stale} pedidos sin actualizar hace 48 h</li>
      </ul>
      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="border border-border p-3">
          <dt className="text-xs text-muted-foreground">Nuevos</dt>
          <dd className="font-mono text-2xl">{fresh}</dd>
        </div>
        <div className="border border-border p-3">
          <dt className="text-xs text-muted-foreground">Esperando respuesta</dt>
          <dd className="font-mono text-2xl">{waiting}</dd>
        </div>
        <div className="border border-border p-3">
          <dt className="text-xs text-muted-foreground">Confirmados</dt>
          <dd className="font-mono text-2xl">{confirmed}</dd>
        </div>
        <div className="border border-border p-3">
          <dt className="text-xs text-muted-foreground">Ventas estimadas</dt>
          <dd className="font-mono text-2xl">{formatMoney(sales._sum.estimatedTotal ? Number(sales._sum.estimatedTotal) : 0)}</dd>
        </div>
      </dl>
      <section className="mt-10">
        <h2 className="font-heading text-xl">Stock bajo</h2>
        <ul className="mt-3 text-sm">
          {critical.length === 0 ? <li>Sin alertas.</li> : null}
          {critical.map((item) => (
            <li key={item.id} className="border-b border-border py-2">
              {item.variant.product.name} {item.variant.name}: {item.onHand - item.reserved} disponibles
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-heading text-xl">Clientes recientes</h2>
        <ul className="mt-3 text-sm">
          {recentCustomers.map((customer) => (
            <li key={customer.id}>
              <Link href={`/admin/clientes/${customer.id}`} className="underline">
                {customer.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-8 text-sm">
        <Link href="/admin/pedidos" className="underline">
          Ver pedidos
        </Link>
      </p>
    </div>
  );
}
