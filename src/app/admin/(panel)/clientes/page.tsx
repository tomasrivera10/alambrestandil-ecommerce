import Link from "next/link";
import { prisma, safeQuery } from "@/lib/db";

export default async function CustomersPage() {
  const customers = await safeQuery(
    () =>
      prisma.customer.findMany({
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { orders: true } }, tags: { include: { tag: true } } },
      }),
    [],
  );
  return (
    <div>
      <h1 className="font-heading text-3xl">Clientes</h1>
      {customers.length === 0 ? <p className="mt-4 text-sm">Sin clientes todavía.</p> : null}
      <table className="mt-6 w-full text-left text-sm">
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
  );
}
