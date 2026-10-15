"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

type Row = {
  id: string;
  productId: string;
  name: string;
  product: string;
  category: string;
  sku: string;
  unit: string;
  sourceRow: number | null;
  listPrice: number | null;
  referenceList: number | null;
  listSource: string;
  discountedReference: number | null;
  discountFormula: boolean;
  finalPrice: number | null;
  priceSource: string;
  stock: number | null;
  reserved: number;
  stockSource: string;
};

const amount = (value: number | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        value,
      );
const quantity = (value: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);

function SaleCell({
  value,
  name,
  onCommit,
}: {
  value: number | null;
  name: string;
  onCommit: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <input
      aria-label={`Simular precio de venta de ${name}`}
      type="text"
      inputMode="decimal"
      placeholder="—"
      value={editing ? draft : amount(value)}
      onFocus={() => {
        setEditing(true);
        setDraft(value == null ? "" : String(value));
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const normalized = draft.includes(",") ? draft.replace(/\./g, "").replace(",", ".") : draft;
        const next = Number(normalized);
        if (draft.trim() !== "" && Number.isFinite(next) && next >= 0) onCommit(next);
        setEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

export function StockAnalysis({ rows, referenceCount }: { rows: Row[]; referenceCount: number }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [discount, setDiscount] = useState(27);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [showDetail, setShowDetail] = useState(false);
  const categories = [...new Set(rows.map((row) => row.category))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!category || row.category === category) &&
          `${row.name} ${row.product} ${row.sku}`
            .toLocaleLowerCase("es")
            .includes(query.toLocaleLowerCase("es")),
      ),
    [rows, query, category],
  );
  const calculated = useMemo(
    () =>
      visible.map((row) => {
        const list = row.listPrice;
        const net =
          row.discountFormula && list != null
            ? list * (1 - discount / 100)
            : row.listSource === "Proveedor" &&
                list != null &&
                row.discountedReference != null &&
                row.referenceList != null &&
                row.referenceList > 0
              ? list * (row.discountedReference / row.referenceList)
              : (row.discountedReference ?? list);
        const sale = priceOverrides[row.id] ?? row.finalPrice;
        const stock = row.stock;
        return {
          row,
          list,
          net,
          sale,
          stock,
          listTotal: list == null || stock == null ? null : list * stock,
          netTotal: net == null || stock == null ? null : net * stock,
          saleTotal: sale == null || stock == null ? null : sale * stock,
        };
      }),
    [visible, discount, priceOverrides],
  );
  const totals = calculated.reduce(
    (sum, item) => ({
      list: sum.list + (item.listTotal ?? 0),
      net: sum.net + (item.netTotal ?? 0),
      sale: sum.sale + (item.saleTotal ?? 0),
      complete:
        sum.complete +
        (item.listTotal != null && item.netTotal != null && item.saleTotal != null ? 1 : 0),
    }),
    { list: 0, net: 0, sale: 0, complete: 0 },
  );
  const clear = () => {
    setQuery("");
    setCategory("");
    setDiscount(27);
    setPriceOverrides({});
    setShowDetail(false);
  };

  return (
    <main className="stock-analysis">
      <header className="stock-analysis-heading">
        <div>
          <h1>Análisis de stock</h1>
          <p>Precios, existencias y márgenes por producto.</p>
        </div>
        <Link href="/admin/stock" className="stock-analysis-link">
          Ver movimientos de stock
        </Link>
      </header>

      <section className="stock-analysis-sheet" aria-label="Planilla de stock y márgenes">
        <div className="stock-analysis-toolbar">
          <label className="stock-analysis-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Buscar producto</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto o SKU"
            />
          </label>
          <label className="stock-analysis-category">
            <span className="sr-only">Filtrar por familia</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Todas las familias</option>
              {categories.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="stock-analysis-discount">
            <span>Descuento</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(event) =>
                setDiscount(Math.min(100, Math.max(0, Number(event.target.value) || 0)))
              }
            />
            <span>%</span>
          </label>
          <button
            type="button"
            className="stock-analysis-tool-button"
            aria-pressed={showDetail}
            onClick={() => setShowDetail((current) => !current)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />{" "}
            {showDetail ? "Menos columnas" : "Más columnas"}
          </button>
          <button
            type="button"
            className="stock-analysis-reset"
            onClick={clear}
            aria-label="Restablecer filtros y simulaciones"
            title="Restablecer filtros y simulaciones"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="stock-analysis-totals" aria-label="Totales de las filas visibles">
          <div>
            <span>Lista</span>
            <strong>{amount(totals.list)}</strong>
          </div>
          <div>
            <span>Costo neto</span>
            <strong>{amount(totals.net)}</strong>
          </div>
          <div>
            <span>Valor de venta</span>
            <strong>{amount(totals.sale)}</strong>
          </div>
          <div className="stock-analysis-total-margin">
            <span>Margen de venta</span>
            <strong>{amount(totals.sale - totals.net)}</strong>
            <small>
              {totals.sale > 0 ? quantity(((totals.sale - totals.net) / totals.sale) * 100) : "0"}%
            </small>
          </div>
        </div>
        <div className="stock-analysis-meta">
          <span>
            {visible.length} filas · {totals.complete} completas · importes en ARS
          </span>
          <span>{referenceCount} artículos de la planilla original</span>
        </div>

        <div className="stock-analysis-scroll">
          <table className={`admin-table stock-analysis-table${showDetail ? " is-detailed" : ""}`}>
            <colgroup>
              <col className="stock-col-product" />
              <col className="stock-col-money" />
              <col className="stock-col-money" />
              <col className="stock-col-money" />
              <col className="stock-col-quantity" />
              {showDetail && (
                <>
                  <col className="stock-col-total" />
                  <col className="stock-col-total" />
                </>
              )}
              <col className="stock-col-total" />
              <col className="stock-col-total" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Lista</th>
                <th scope="col">Neto</th>
                <th scope="col">Venta</th>
                <th scope="col">Cant.</th>
                {showDetail && (
                  <>
                    <th scope="col">Total lista</th>
                    <th scope="col">Total costo</th>
                  </>
                )}
                <th scope="col">Total venta</th>
                <th scope="col">Margen</th>
              </tr>
            </thead>
            <tbody>
              {calculated.map(({ row, list, net, stock, listTotal, netTotal, saleTotal }) => (
                <tr key={row.id}>
                  <td
                    className="stock-analysis-product"
                    title={`${row.name} · ${row.sku}${row.sourceRow ? ` · Excel fila ${row.sourceRow}` : ""}`}
                  >
                    <div className="stock-analysis-product-line">
                      {row.productId ? (
                        <Link href={`/admin/productos/${row.productId}`}>{row.name}</Link>
                      ) : (
                        <span>{row.name}</span>
                      )}
                      {(row.listSource === "Excel" ||
                        row.priceSource === "Excel" ||
                        row.stockSource === "Excel") && (
                        <small title="Contiene valores de la planilla original">Excel</small>
                      )}
                    </div>
                  </td>
                  <td title={`Precio de lista · ${row.listSource}`}>{amount(list)}</td>
                  <td
                    title={`Costo con descuento · ${row.discountFormula ? `${quantity(discount)}%` : "valor registrado"}`}
                  >
                    {amount(net)}
                  </td>
                  <td
                    className="stock-analysis-editable"
                    title={`Precio final · ${row.priceSource}`}
                  >
                    <SaleCell
                      name={row.name}
                      value={priceOverrides[row.id] ?? row.finalPrice}
                      onCommit={(value) =>
                        setPriceOverrides((current) => ({ ...current, [row.id]: value }))
                      }
                    />
                  </td>
                  <td
                    title={`Cantidad ${row.unit} · ${row.stockSource}${row.reserved > 0 ? ` · ${quantity(row.reserved)} reservado` : ""}`}
                  >
                    {stock == null ? "—" : quantity(stock)}
                  </td>
                  {showDetail && (
                    <>
                      <td>{amount(listTotal)}</td>
                      <td>{amount(netTotal)}</td>
                    </>
                  )}
                  <td>{amount(saleTotal)}</td>
                  <td className={netTotal == null || saleTotal == null || saleTotal - netTotal === 0 ? "stock-analysis-margin is-zero" : "stock-analysis-margin"}>
                    {amount(netTotal == null || saleTotal == null ? null : saleTotal - netTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {visible.length > 0 && (
              <tfoot>
                <tr>
                  <th scope="row">Total visible</th>
                  <td />
                  <td />
                  <td />
                  <td />
                  {showDetail && (
                    <>
                      <td>{amount(totals.list)}</td>
                      <td>{amount(totals.net)}</td>
                    </>
                  )}
                  <td>{amount(totals.sale)}</td>
                  <td>{amount(totals.sale - totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {visible.length === 0 && (
          <p className="stock-analysis-empty">No hay productos para ese filtro.</p>
        )}
        <footer className="stock-analysis-footer">
          <p>
            Lista × cantidad · Neto × cantidad · Venta × cantidad · Margen = venta − costo neto.
          </p>
          <p>
            «Excel» indica un valor histórico. Los cambios de precio en esta vista son simulaciones.
          </p>
        </footer>
      </section>
    </main>
  );
}
