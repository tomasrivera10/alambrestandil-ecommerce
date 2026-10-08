import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import {
  approveSupplierList,
  reviewSupplierRow,
  updateSupplierItem,
} from "@/features/suppliers/actions";
import { SupplierUpload } from "@/components/admin/supplier-upload";
import type { ImportedRow } from "@/features/suppliers/parse";

export const maxDuration = 60;

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("suppliers");
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      items: { orderBy: { name: "asc" } },
      lists: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!supplier) notFound();
  const variants = await prisma.productVariant.findMany({
    where: { active: true },
    select: { id: true, sku: true, name: true },
    orderBy: { sku: "asc" },
  });
  const low = await prisma.inventory.findMany({
    where: {
      variantId: {
        in: supplier.items
          .filter((item) => item.purchased && item.variantId)
          .map((item) => item.variantId!),
      },
    },
  });
  const shortage = low.filter(
    (item) =>
      item.onHand - item.reserved <= 0 ||
      (item.minStock > 0 && item.onHand - item.reserved <= item.minStock),
  );
  const itemByVariant = new Map(
    supplier.items
      .filter((item) => item.purchased && item.variantId)
      .map((item) => [item.variantId, item]),
  );
  const itemByCode = new Map(supplier.items.map((item) => [item.code, item]));
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>{supplier.name}</h1>
          <p>
            {supplier.items.length} artículos en catálogo ·{" "}
            {supplier.items.filter((item) => item.purchased).length} que compramos
          </p>
        </div>
      </div>
      <SupplierUpload supplierId={id} />
      <section className="mt-9">
        <h2 className="admin-section-title">Listas recibidas</h2>
        <div className="space-y-4">
          {supplier.lists.map((list) => {
            const rows = list.rows as ImportedRow[];
            const pending = rows.filter((row) => row.warning || row.price == null);
            return (
              <details key={list.id} className="admin-panel p-4" open={list.status === "REVIEW"}>
                <summary className="cursor-pointer font-medium">
                  {list.filename} · {list.status === "REVIEW" ? "Para revisar" : "Aprobada"} ·{" "}
                  {rows.length} filas
                </summary>
                <p className="my-3 text-sm text-muted-foreground">
                  <a
                    className="mr-3 font-semibold text-primary underline"
                    href={`/api/admin/supplier-lists/${list.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir documento original
                  </a>
                  {list.notes} {pending.length} filas requieren corrección.
                </p>
                {list.status === "REVIEW" && (
                  <>
                    <div className="max-h-[480px] overflow-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Precio de lista</th>
                            <th>Cambio</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, index) => (
                            <tr key={index}>
                              <td>{row.page ?? index + 1}</td>
                              <td>{row.code}</td>
                              <td>{row.name}</td>
                              <td>
                                {row.price == null ? "—" : `$ ${row.price.toLocaleString("es-AR")}`}
                              </td>
                              <td>
                                {itemByCode.get(row.code)?.listPrice && row.price != null
                                  ? `${Math.round((row.price / Number(itemByCode.get(row.code)!.listPrice) - 1) * 100)} %`
                                  : "Nuevo"}
                              </td>
                              <td>
                                {row.warning ? (
                                  <details>
                                    <summary className="cursor-pointer text-primary">
                                      Revisar
                                    </summary>
                                    <form
                                      action={reviewSupplierRow}
                                      className="grid min-w-64 gap-2 py-2"
                                    >
                                      <input hidden name="listId" value={list.id} readOnly />
                                      <input hidden name="index" value={index} readOnly />
                                      <input
                                        className="admin-input"
                                        name="code"
                                        defaultValue={row.code}
                                        aria-label="Código"
                                      />
                                      <input
                                        className="admin-input"
                                        name="name"
                                        defaultValue={row.name}
                                        aria-label="Nombre"
                                      />
                                      <input
                                        className="admin-input"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        defaultValue={row.price ?? ""}
                                        aria-label="Precio"
                                      />
                                      <button className="admin-button">Confirmar fila</button>
                                    </form>
                                  </details>
                                ) : (
                                  "Lista"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await approveSupplierList(list.id);
                      }}
                    >
                      <button className="admin-button mt-4" disabled={pending.length > 0}>
                        Aprobar lista
                      </button>
                    </form>
                  </>
                )}
              </details>
            );
          })}
        </div>
      </section>
      <section className="mt-9">
        <h2 className="admin-section-title">Reposición</h2>
        <p className="text-sm text-muted-foreground">
          {shortage.length
            ? `${shortage.length} productos elegidos están en el mínimo o por debajo.`
            : "Los productos elegidos están por encima del mínimo configurado."}
        </p>
        {shortage.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Disponible</th>
                  <th>Mínimo</th>
                  <th>Faltante hasta mínimo</th>
                  <th>Lista</th>
                </tr>
              </thead>
              <tbody>
                {shortage.map((stock) => {
                  const item = itemByVariant.get(stock.variantId);
                  return (
                    <tr key={stock.id}>
                      <td>{item?.name ?? stock.variantId}</td>
                      <td>{stock.onHand - stock.reserved}</td>
                      <td>{stock.minStock}</td>
                      <td>{Math.max(0, stock.minStock - (stock.onHand - stock.reserved))}</td>
                      <td>
                        {item?.listPrice
                          ? `$ ${Number(item.listPrice).toLocaleString("es-AR")}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mt-9">
        <h2 className="admin-section-title">Productos del proveedor</h2>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Lista</th>
                <th>Compramos</th>
                <th>Vincular con</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {supplier.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>
                    {item.listPrice ? `$ ${Number(item.listPrice).toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td colSpan={3}>
                    <form action={updateSupplierItem} className="flex items-center gap-3">
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        name="purchased"
                        type="checkbox"
                        defaultChecked={item.purchased}
                        aria-label={`Compramos ${item.name}`}
                      />
                      <select
                        name="variantId"
                        defaultValue={item.variantId ?? ""}
                        className="admin-input max-w-64"
                      >
                        <option value="">Sin vincular</option>
                        {variants.map((v) => (
                          <option value={v.id} key={v.id}>
                            {v.sku} · {v.name}
                          </option>
                        ))}
                      </select>
                      <button className="admin-button-secondary">Guardar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
