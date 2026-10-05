import { prisma, safeQuery } from "@/lib/db";
import { recordStockForm } from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";

export default async function StockPage() {
  const rows = await safeQuery(
    () =>
      prisma.inventory.findMany({
        include: { variant: { include: { product: true } } },
        orderBy: { onHand: "asc" },
      }),
    [],
  );
  const critical = rows.filter((row) => row.onHand - row.reserved <= row.minStock);

  return (
    <div>
      <h1 className="font-heading text-3xl">Stock</h1>
      <p className="mt-2 text-sm">{critical.length} en nivel crítico o por debajo del mínimo.</p>
      <table className="mt-6 w-full text-left text-sm">
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
              <td className="py-2">{row.variant.product.name} {row.variant.name}</td>
              <td className="font-mono">{row.onHand}</td>
              <td className="font-mono">{row.reserved}</td>
              <td className="font-mono">{row.onHand - row.reserved}</td>
              <td className="font-mono">{row.minStock}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={recordStockForm} className="mt-8 grid max-w-md gap-3 text-sm">
        <h2 className="font-heading text-xl">Movimiento</h2>
        <select name="variantId" className="h-10 border border-input bg-card px-2" required>
          {rows.map((row) => (
            <option key={row.variantId} value={row.variantId}>
              {row.variant.sku}
            </option>
          ))}
        </select>
        <select name="type" className="h-10 border border-input bg-card px-2">
          {["ENTRADA", "VENTA", "AJUSTE", "DEVOLUCION", "RESERVA", "CANCELACION"].map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <input name="quantity" type="number" required className="h-10 border border-input px-2" placeholder="Cantidad" />
        <input name="reason" className="h-10 border border-input px-2" placeholder="Motivo" />
        <Button type="submit">Registrar</Button>
      </form>
    </div>
  );
}
