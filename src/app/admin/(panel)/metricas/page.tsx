import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireArea("metrics");
  const { days = "30" } = await searchParams;
  const period = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const clock = await prisma.$queryRaw<{ now: Date }[]>`SELECT CURRENT_TIMESTAMP AS now`;
  const since = new Date(clock[0].now.getTime() - period * 86_400_000);
  const [orders, counterSales, movements] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: "ENTREGADO",
        history: { some: { toStatus: "ENTREGADO", createdAt: { gte: since } } },
      },
      include: { items: true },
    }),
    prisma.counterSale.findMany({ where: { createdAt: { gte: since } }, include: { lines: true } }),
    prisma.stockMovement.findMany({
      where: { type: "VENTA", createdAt: { gte: since } },
      include: { variant: true },
    }),
  ]);
  const totals = new Map<string, { name: string; quantity: number }>();
  for (const move of movements) {
    const current = totals.get(move.variantId) ?? { name: move.variant.name, quantity: 0 };
    current.quantity += move.quantity;
    totals.set(move.variantId, current);
  }
  const ranking = [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  const revenue =
    orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((lineSum, item) => lineSum + Number(item.lineTotal ?? 0), 0),
      0,
    ) + counterSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Métricas</h1>
          <p>Ventas registradas y movimiento real de productos.</p>
        </div>
        <form>
          <select className="admin-input" name="days" defaultValue={period}>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
          <button className="admin-button ml-2">Aplicar</button>
        </form>
      </div>
      <div className="admin-summary">
        <div>
          <strong>{orders.length + counterSales.length}</strong>
          <span>ventas entregadas</span>
        </div>
        <div>
          <strong>$ {revenue.toLocaleString("es-AR")}</strong>
          <span>importe registrado</span>
        </div>
        <div>
          <strong>{movements.length}</strong>
          <span>salidas por venta</span>
        </div>
      </div>
      <section className="mt-9">
        <h2 className="admin-section-title">Productos más vendidos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Ordenados por unidades de su propia presentación; kg, metros y rollos no se suman entre
          sí.
        </p>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              Todavía no hay ventas entregadas en este período.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
