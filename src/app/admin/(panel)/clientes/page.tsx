import { requireArea } from "@/server/rbac";
import Link from "next/link";
import { prisma, safeQuery } from "@/server/db";

export default async function CustomersPage() {
  await requireArea("customers");
  const customers = await safeQuery(
    () =>
      prisma.customer.findMany({
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { orders: true } }, tags: { include: { tag: true } } },
      }),
    [],
  );
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Clientes</h1>
          <p>Encontrá sus pedidos, datos de contacto y notas de atención.</p>
        </div>
      </div>
      {customers.length === 0 ? <p className="mt-4 text-sm">Sin clientes todavía.</p> : null}
      <div className="overflow-x-auto">
        <table className="admin-table mt-6">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Localidad</th>
              <th>Pedidos</th>
              <th>Etiquetas</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border">
                <td className="py-2">
                  <Link className="underline" href={`/admin/clientes/${customer.id}`}>
                    {customer.name}
                  </Link>
                </td>
                <td>{customer.phone}</td>
                <td>{customer.locality}</td>
                <td>{customer._count.orders} pedidos</td>
                <td>{customer.tags.map((item) => item.tag.name).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
