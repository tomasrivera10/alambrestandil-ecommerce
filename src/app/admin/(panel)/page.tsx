import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, requireArea } from "@/lib/rbac";
import { countStaleOrders } from "@/features/orders/attention";

export default async function DashboardPage() {
  const session = await getSession();
  if (session?.user.role === "STOCK") redirect("/admin/stock");
  await requireArea("orders");
  const [fresh, waiting, inventory, pendingLists, recentSales, stale] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["NUEVO", "ENVIADO_A_WHATSAPP"] } } }),
    prisma.order.count({ where: { status: { in: ["CONTACTADO", "COTIZADO"] } } }),
    prisma.inventory.findMany({ include: { variant: { include: { product: true } } } }),
    prisma.supplierPriceList.count({ where: { status: "REVIEW" } }),
    prisma.counterSale.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    countStaleOrders(),
  ]);
  const low = inventory
    .filter(
      (item) =>
        item.variant.product.status === "ACTIVE" &&
        (item.onHand - item.reserved <= 0 ||
          (item.minStock > 0 && item.onHand - item.reserved <= item.minStock)),
    )
    .sort((a, b) => a.onHand - a.reserved - (b.onHand - b.reserved));
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Buen día, {session?.user.name?.split(" ")[0] ?? "equipo"}</h1>
          <p>Lo que necesita atención hoy en Alambres Tandil.</p>
        </div>
        <Link href="/admin/ventas" className="admin-button">
          Registrar venta
        </Link>
      </div>
      <div className="admin-summary">
        <div>
          <strong>{fresh}</strong>
          <span>pedidos nuevos</span>
        </div>
        <div>
          <strong>{waiting}</strong>
          <span>esperando respuesta</span>
        </div>
        <div>
          <strong>{low.length}</strong>
          <span>productos por reponer</span>
        </div>
        <div>
          <strong>{pendingLists}</strong>
          <span>listas para revisar</span>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <section className="admin-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="admin-section-title">Prioridades</h2>
            <Link className="text-sm font-semibold text-primary" href="/admin/pedidos">
              Ver pedidos
            </Link>
          </div>
          <ul className="divide-y divide-border text-sm">
            <li className="flex justify-between py-3">
              <span>Pedidos nuevos por atender</span>
              <strong>{fresh}</strong>
            </li>
            <li className="flex justify-between py-3">
              <span>Pedidos sin actualizar hace 48 horas</span>
              <strong>{stale}</strong>
            </li>
            <li className="flex justify-between py-3">
              <span>Listas pendientes de revisión</span>
              <strong>{pendingLists}</strong>
            </li>
          </ul>
        </section>
        <section className="admin-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="admin-section-title">Stock bajo</h2>
            <Link className="text-sm font-semibold text-primary" href="/admin/stock?state=low">
              Ver stock
            </Link>
          </div>
          {low.length ? (
            <ul className="divide-y divide-border text-sm">
              {low.slice(0, 6).map((item) => (
                <li className="flex justify-between gap-3 py-3" key={item.id}>
                  <span>
                    {item.variant.product.name} · {item.variant.name}
                  </span>
                  <strong className="whitespace-nowrap">{item.onHand - item.reserved}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay productos por debajo del mínimo configurado.
            </p>
          )}
        </section>
      </div>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="admin-section-title">Ventas recientes</h2>
          <Link className="text-sm font-semibold text-primary" href="/admin/metricas">
            Ver métricas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Canal</th>
                <th>Cliente</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.createdAt.toLocaleDateString("es-AR")}</td>
                  <td>{sale.channel}</td>
                  <td>{sale.customerName ?? "—"}</td>
                  <td>$ {Number(sale.total).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentSales.length === 0 && (
            <p className="bg-white p-5 text-sm text-muted-foreground">
              Las ventas de mostrador y WhatsApp aparecerán acá al registrarlas.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
