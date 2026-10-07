import { requireArea } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/db";
import { StockMovementForm } from "@/components/admin/stock-movement-form";
import Link from "next/link";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  await requireArea("inventory");
  const rows = await safeQuery(
    () =>
      prisma.inventory.findMany({
        where: {
          variant: {
            product: { status: "ACTIVE" },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          },
        },
        include: {
          variant: { include: { product: true, _count: { select: { movements: true } } } },
        },
        orderBy: { onHand: "asc" },
      }),
    [],
  );
  const critical = rows.filter(
    (row) => row.minStock > 0 && row.onHand - row.reserved <= row.minStock,
  );

  return (
    <div className="max-w-7xl">
      <h1 className="font-heading text-3xl">Stock</h1>
      <p className="mt-2 text-sm">{critical.length} en nivel crítico o por debajo del mínimo.</p>
      <form className="mt-5 flex max-w-lg gap-3">
        <label className="grid flex-1 gap-1 text-sm">
          Buscar variante
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre o SKU"
            className="h-10 border border-input px-3"
          />
        </label>
        <button className="self-end h-10 bg-primary px-4 text-sm text-primary-foreground">
          Buscar
        </button>
      </form>
      <div className="mt-8 border-y border-border py-6">
        <StockMovementForm
          variants={rows.map((r) => ({
            id: r.variantId,
            name: r.variant.name,
            sku: r.variant.sku,
            unit: r.variant.salesUnit ?? r.variant.product.salesUnit,
          }))}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="mt-6 min-w-[650px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-2">Producto</th>
              <th>Físico</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2">
                  <Link className="underline" href={`/admin/productos/${row.variant.productId}`}>
                    {row.variant.name}
                  </Link>
                  <small className="block text-muted-foreground">
                    {row.variant.sku} ·{" "}
                    {(row.variant.salesUnit ?? row.variant.product.salesUnit).toLowerCase()}
                    {row.variant._count.movements === 0 ? " · Sin cargar" : ""}
                  </small>
                </td>
                <td className="font-mono">{row.onHand}</td>
                <td className="font-mono">{row.reserved}</td>
                <td className="font-mono">{row.onHand - row.reserved}</td>
                <td className="font-mono">{row.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
