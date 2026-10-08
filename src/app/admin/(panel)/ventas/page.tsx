import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { CounterSaleForm } from "@/components/admin/counter-sale-form";

export default async function SalesPage() {
  await requireArea("orders");
  const [variants, sales] = await Promise.all([
    prisma.productVariant.findMany({
      where: { active: true, product: { status: "ACTIVE" } },
      include: { product: true, inventory: true },
      orderBy: { sku: "asc" },
    }),
    prisma.counterSale.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    }),
  ]);
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Ventas</h1>
          <p>Registrá ventas de mostrador y WhatsApp para mantener el stock al día.</p>
        </div>
      </div>
      <CounterSaleForm
        variants={variants
          .filter((v) => v.inventory && v.inventory.onHand - v.inventory.reserved > 0)
          .map((v) => ({
            id: v.id,
            name: `${v.product.name} · ${v.name}`,
            sku: v.sku,
            available: v.inventory!.onHand - v.inventory!.reserved,
            price: Number(v.price ?? v.product.price) || null,
          }))}
      />
      <section className="mt-10">
        <h2 className="admin-section-title">Ventas recientes</h2>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Canal</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.createdAt.toLocaleDateString("es-AR")}</td>
                  <td>{sale.channel}</td>
                  <td>{sale.customerName ?? "—"}</td>
                  <td>{sale.lines.length}</td>
                  <td>$ {Number(sale.total).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
