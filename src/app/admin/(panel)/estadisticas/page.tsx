import Link from "next/link";
import workbookRows from "@/data/stock-workbook.json";
import { can, requireArea } from "@/server/rbac";
import "./statistics.css";

export const dynamic = "force-dynamic";

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const number = (value: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value);
const percent = (value: number) => `${number(value)} %`;

export default async function StockStatisticsPage() {
  const { role } = await requireArea("metrics");
  const categories = new Map<string, { name: string; cost: number; sale: number; margin: number; lines: number; missing: number }>();
  let stocked = 0;
  let complete = 0;
  let missingCost = 0;
  let missingSale = 0;
  let totalCost = 0;
  let totalSale = 0;
  const largest: { name: string; category: string; sale: number; cost: number }[] = [];

  for (const row of workbookRows) {
    const stock = row.stock ?? 0;
    if (stock <= 0) continue;
    stocked++;
    const cost = row.discountFormula && row.list != null
      ? row.list * 0.73
      : (row.discounted ?? row.list);
    const sale = row.final;
    const group = categories.get(row.category) ?? { name: row.category, cost: 0, sale: 0, margin: 0, lines: 0, missing: 0 };
    group.lines++;
    if (cost == null || cost < 0) missingCost++;
    if (sale == null || sale < 0) missingSale++;
    if (cost != null && cost >= 0 && sale != null && sale >= 0) {
      const rowCost = cost * stock;
      const rowSale = sale * stock;
      complete++;
      totalCost += rowCost;
      totalSale += rowSale;
      group.cost += rowCost;
      group.sale += rowSale;
      group.margin += rowSale - rowCost;
      largest.push({ name: row.name, category: row.category, sale: rowSale, cost: rowCost });
    } else group.missing++;
    categories.set(row.category, group);
  }
  const margin = totalSale - totalCost;
  const categoryRows = [...categories.values()].sort((a, b) => b.sale - a.sale);
  const maxSale = Math.max(...categoryRows.map((row) => row.sale), 1);
  const topProducts = largest.sort((a, b) => b.sale - a.sale).slice(0, 8);
  const coverage = stocked ? (complete / stocked) * 100 : 0;

  return (
    <main className="admin-page stock-statistics">
      <div className="admin-page-heading">
        <div>
          <h1>Estadísticas de stock</h1>
          <p>Valor y margen potencial de la hoja de stock.</p>
        </div>
        {can(role, "products") && <Link className="admin-button-secondary" href="/admin/analisis-stock">Ver detalle de productos</Link>}
      </div>
      <div className="stock-statistics-summary" aria-label="Indicadores de stock">
        <div><span>Valor de venta de todo el stock</span><strong>{money(totalSale)}</strong><small>Filas con costo y precio completos</small></div>
        <div><span>Costo estimado del stock</span><strong>{money(totalCost)}</strong><small>Sobre las mismas filas</small></div>
        <div><span>Ganancia bruta potencial</span><strong>{money(margin)}</strong><small>{totalSale > 0 ? percent((margin / totalSale) * 100) : "—"} de margen sobre venta</small></div>
        <div><span>Artículos con existencias</span><strong>{number(stocked)}</strong><small>{number(complete)} con valoración completa</small></div>
      </div>
      <p className="stock-statistics-note">Proyección de vender todo el stock al precio de la hoja. Ganancia bruta = venta − costo; no incluye impuestos, gastos ni descuentos de venta. Las cantidades usan unidades distintas y por eso no se suman.</p>
      <div className="stock-statistics-grid">
        <section className="stock-statistics-panel" aria-labelledby="category-heading">
          <div className="stock-statistics-panel-heading"><h2 id="category-heading">Valor por familia</h2><span>Venta potencial</span></div>
          {categoryRows.length ? <div className="stock-statistics-bars">
            {categoryRows.map((row) => <div className="stock-statistics-bar-row" key={row.name}>
              <div><strong>{row.name}</strong><span>{money(row.sale)}</span></div>
              <div className="stock-statistics-track" role="img" aria-label={`${row.name}: ${money(row.sale)} en venta potencial`}><span style={{ width: `${(row.sale / maxSale) * 100}%` }} /></div>
            </div>)}
          </div> : <p>No hay artículos con existencias en la hoja.</p>}
        </section>
        <section className="stock-statistics-panel" aria-labelledby="margin-heading">
          <div className="stock-statistics-panel-heading"><h2 id="margin-heading">Margen por familia</h2><span>Sobre venta</span></div>
          <div className="stock-statistics-family-list">
            {categoryRows.map((row) => <div key={row.name}><span>{row.name}</span><strong>{row.sale > 0 ? percent((row.margin / row.sale) * 100) : "—"}</strong><small>{money(row.margin)}</small></div>)}
          </div>
        </section>
      </div>
      <div className="stock-statistics-grid">
        <section className="stock-statistics-panel" aria-labelledby="coverage-heading">
          <div className="stock-statistics-panel-heading"><h2 id="coverage-heading">Calidad de los datos</h2></div>
          <div className="stock-statistics-coverage"><strong>{percent(coverage)}</strong><span>del stock con costo y precio</span></div>
          <div className="stock-statistics-track" role="img" aria-label={`${percent(coverage)} de artículos con valoración completa`}><span style={{ width: `${coverage}%` }} /></div>
          <p>{number(missingCost)} artículos sin costo · {number(missingSale)} sin precio de venta. Los importes de arriba excluyen las filas incompletas.</p>
        </section>
        <section className="stock-statistics-panel" aria-labelledby="products-heading">
          <div className="stock-statistics-panel-heading"><h2 id="products-heading">Mayor valor inmovilizado</h2><span>Top 8</span></div>
          <ol className="stock-statistics-products">{topProducts.map((row) => <li key={`${row.category}-${row.name}`}><span>{row.name}<small>{row.category}</small></span><strong>{money(row.cost)}</strong></li>)}</ol>
        </section>
      </div>
      <p className="stock-statistics-note">Para filas con fórmula de descuento se aplica el 27 % de la hoja al precio de lista. Si una fila no tiene fórmula, se usa su costo neto registrado; si falta, su precio de lista. {can(role, "products") && <Link href="/admin/analisis-stock">Revisá los importes por artículo</Link>}</p>
    </main>
  );
}
