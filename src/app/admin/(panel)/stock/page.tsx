import Link from "next/link";
import { Calculator, ClipboardCheck, History, ArrowDownUp } from "lucide-react";
import { requireArea, can } from "@/server/rbac";
import { prisma } from "@/server/db";
import { StockMovementForm } from "@/components/admin/stock-movement-form";
import { StockTool } from "@/components/admin/stock-tools";
import { StockCountForm } from "@/components/admin/stock-count-form";
import { StockCategoryWorkspace } from "@/components/admin/stock-category-workspace";
import { unitLabel } from "@/lib/format";

const movementLabels: Record<string, string> = {
  ENTRADA: "Ingreso",
  AJUSTE: "Ajuste",
  DEVOLUCION: "Devolución",
  SALIDA: "Salida",
  RESERVA: "Reserva",
  LIBERACION: "Liberación",
  CANCELACION: "Liberación de reserva",
  VENTA: "Venta",
};

export default async function StockPage() {
  const { role } = await requireArea("inventory");
  const [rows, recent, categories] = await Promise.all([
    prisma.inventory.findMany({
      where: { variant: { product: { status: "ACTIVE" } } },
      include: {
        variant: {
          include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
        },
      },
      orderBy: [{ variant: { product: { name: "asc" } } }, { variant: { name: "asc" } }],
    }),
    prisma.stockMovement.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { variant: { include: { product: true } }, user: true },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const stockCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    image: null,
    rows: rows
      .filter((row) => row.variant.product.categoryId === category.id)
      .map((row) => ({
        id: row.variantId,
        productId: row.variant.productId,
        product: row.variant.product.name,
        variant: row.variant.name,
        sku: row.variant.sku,
        image: row.variant.product.images[0]?.url ?? null,
        unit: row.variant.salesUnit ?? row.variant.product.salesUnit,
        onHand: row.onHand,
        reserved: row.reserved,
        minStock: row.minStock,
      })),
  }));
  const variants = rows.map((row) => ({
    id: row.variantId,
    name: `${row.variant.product.name} · ${row.variant.name}`,
    sku: row.variant.sku,
    unit: row.variant.salesUnit ?? row.variant.product.salesUnit,
    onHand: row.onHand,
    reserved: row.reserved,
  }));
  return (
    <main className="admin-page workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Stock</h1>
          <p>Encontrá una presentación y registrá la mercadería que ingresa.</p>
        </div>
        {can(role, "products") && (
          <Link href="/admin/analisis-stock" className="admin-button-secondary">
            <Calculator size={17} aria-hidden="true" />
            Análisis de stock
          </Link>
        )}
      </div>
      <nav className="workspace-task-links" aria-label="Tareas de stock">
        <a href="#inventario">Existencias e ingresos</a>
        <a href="#recuento">
          <ClipboardCheck size={16} aria-hidden="true" />
          Recuento físico
        </a>
        <a href="#movimientos">
          <ArrowDownUp size={16} aria-hidden="true" />
          Otros movimientos
        </a>
        <a href="#historial">
          <History size={16} aria-hidden="true" />
          Historial
        </a>
      </nav>
      <div id="inventario" className="admin-anchor">
        <StockCategoryWorkspace categories={stockCategories} />
      </div>
      <div className="workspace-stock-tools">
        <StockTool
          id="recuento"
          title="Recuento físico"
          description="Compará lo contado con el saldo del sistema"
        >
          <StockCountForm variants={variants} />
        </StockTool>
        <StockTool
          id="movimientos"
          title="Otros movimientos"
          description="Registrá ajustes o devoluciones con su motivo"
        >
          <StockMovementForm variants={variants} />
        </StockTool>
      </div>
      <section className="workspace-history admin-anchor" id="historial">
        <div className="workspace-section-heading">
          <h2>Últimos movimientos</h2>
          <p>Los 12 registros más recientes</p>
        </div>
        <div
          className="workspace-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Historial de stock, desplazable horizontalmente"
        >
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto / presentación</th>
                <th>Movimiento</th>
                <th>Cantidad</th>
                <th>Responsable y motivo</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((move) => (
                <tr key={move.id}>
                  <td className="workspace-nowrap">
                    {move.createdAt.toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </td>
                  <td>
                    <strong>{move.variant.product.name}</strong>
                    <p>{move.variant.name}</p>
                  </td>
                  <td>{movementLabels[move.type] ?? move.type}</td>
                  <td className="workspace-number">
                    {move.quantity.toLocaleString("es-AR")}{" "}
                    {unitLabel(move.variant.salesUnit ?? move.variant.product.salesUnit)}
                  </td>
                  <td>
                    {move.user?.name ?? "Sistema"}
                    <p>{move.reason}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!recent.length && (
          <p className="workspace-footnote">
            Los ingresos, ajustes y recuentos aparecerán acá al confirmarlos.
          </p>
        )}
      </section>
    </main>
  );
}
