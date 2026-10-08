import Link from "next/link";
import { requireArea } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { StockMovementForm } from "@/components/admin/stock-movement-form";
import { StockCountForm } from "@/components/admin/stock-count-form";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  await requireArea("inventory");
  const { q = "", state = "all" } = await searchParams;
  const [rows, recent] = await Promise.all([
    prisma.inventory.findMany({
      where: {
        variant: {
          product: { status: "ACTIVE" },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
      },
      include: { variant: { include: { product: true } } },
      orderBy: { variant: { sku: "asc" } },
    }),
    prisma.stockMovement.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { variant: true, user: true },
    }),
  ]);
  const filtered = rows.filter((row) =>
    state === "low"
      ? row.onHand - row.reserved <= 0 ||
        (row.minStock > 0 && row.onHand - row.reserved <= row.minStock)
      : state === "zero"
        ? row.onHand - row.reserved <= 0
        : true,
  );
  const critical = rows.filter(
    (row) =>
      row.onHand - row.reserved <= 0 ||
      (row.minStock > 0 && row.onHand - row.reserved <= row.minStock),
  ).length;
  const variants = rows.map((row) => ({
    id: row.variantId,
    name: `${row.variant.product.name} · ${row.variant.name}`,
    sku: row.variant.sku,
    unit: row.variant.salesUnit ?? row.variant.product.salesUnit,
    onHand: row.onHand,
    reserved: row.reserved,
  }));
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Stock</h1>
          <p>Existencias reales, reservas y movimientos por variante.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-button">
          Nuevo producto
        </Link>
      </div>
      <div className="admin-summary">
        <div>
          <strong>{rows.length}</strong>
          <span>variantes visibles</span>
        </div>
        <div>
          <strong>{critical}</strong>
          <span>en mínimo o menos</span>
        </div>
        <div>
          <strong>{rows.filter((r) => r.onHand - r.reserved <= 0).length}</strong>
          <span>sin disponibilidad</span>
        </div>
      </div>
      <form className="admin-toolbar">
        <input
          className="admin-input flex-1"
          name="q"
          defaultValue={q}
          placeholder="Buscar nombre o SKU"
          aria-label="Buscar stock"
        />
        <select name="state" defaultValue={state} className="admin-input">
          <option value="all">Todos</option>
          <option value="low">Bajo stock</option>
          <option value="zero">Sin disponibilidad</option>
        </select>
        <button className="admin-button">Filtrar</button>
      </form>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Físico</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Mínimo</th>
              <th>Precio de venta</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const available = row.onHand - row.reserved;
              const low = available <= 0 || (row.minStock > 0 && available <= row.minStock);
              return (
                <tr key={row.id}>
                  <td>
                    <Link
                      className="font-medium hover:text-primary"
                      href={`/admin/productos/${row.variant.productId}`}
                    >
                      {row.variant.product.name} · {row.variant.name}
                    </Link>
                    <small className="block text-muted-foreground">
                      {row.variant.sku} ·{" "}
                      {(row.variant.salesUnit ?? row.variant.product.salesUnit).toLowerCase()}
                    </small>
                  </td>
                  <td>{row.onHand}</td>
                  <td>{row.reserved}</td>
                  <td className="font-semibold">{available}</td>
                  <td>{row.minStock}</td>
                  <td>
                    {(row.variant.price ?? row.variant.product.price)
                      ? `$ ${Number(row.variant.price ?? row.variant.product.price).toLocaleString("es-AR")}`
                      : "A confirmar"}
                    <Link
                      className="ml-2 text-primary underline"
                      href={`/admin/productos/${row.variant.productId}`}
                    >
                      Editar
                    </Link>
                  </td>
                  <td>
                    <span className={low ? "admin-badge-warning" : "admin-badge"}>
                      {available <= 0 ? "Sin stock" : low ? "Reponer" : "Disponible"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-6 text-sm text-muted-foreground">No hay variantes para este filtro.</p>
        )}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <StockMovementForm variants={variants} />
        </div>
        <StockCountForm variants={variants} />
      </div>
      <section className="mt-10">
        <h2 className="admin-section-title">Últimos movimientos</h2>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Responsable</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((move) => (
                <tr key={move.id}>
                  <td>{move.createdAt.toLocaleDateString("es-AR")}</td>
                  <td>
                    {move.variant.sku} · {move.variant.name}
                  </td>
                  <td>{move.type}</td>
                  <td>{move.quantity}</td>
                  <td>{move.user?.name ?? "Sistema"}</td>
                  <td>{move.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
