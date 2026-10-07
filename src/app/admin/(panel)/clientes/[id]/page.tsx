import { requireArea } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatOrderNumber } from "@/lib/format";
import { addCustomerNote } from "@/features/crm/actions";
import { Button } from "@/components/ui/button";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("customers");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" }, include: { user: true } },
      tags: { include: { tag: true } },
      quotes: true,
    },
  });
  if (!customer) notFound();
  const total = customer.orders.reduce((sum, order) => sum + Number(order.estimatedTotal ?? 0), 0);
  const average = customer.orders.length ? total / customer.orders.length : 0;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl">{customer.name}</h1>
      <p className="mt-2 text-sm">{customer.phone} · {customer.locality} · {customer.status}</p>
      <p className="text-sm">{customer.tags.map((item) => item.tag.name).join(", ")}</p>
      <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <div className="border border-border p-3"><dt>Pedidos</dt><dd className="font-mono text-xl">{customer.orders.length}</dd></div>
        <div className="border border-border p-3"><dt>Facturación estimada</dt><dd className="font-mono text-xl">{formatMoney(total)}</dd></div>
        <div className="border border-border p-3"><dt>Ticket promedio</dt><dd className="font-mono text-xl">{formatMoney(average)}</dd></div>
      </dl>
      <h2 className="mt-8 font-heading text-xl">Historial</h2>
      {customer.orders.length === 0 && customer.notes.length === 0 ? (
        <p className="mt-2 text-sm">Sin historial comercial.</p>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm">
        {customer.orders.map((order) => (
          <li key={order.id}>{formatOrderNumber(order.number)} · {order.status}</li>
        ))}
        {customer.notes.map((note) => (
          <li key={note.id}>{note.body}</li>
        ))}
      </ul>
      <form
        className="mt-6 grid gap-2"
        action={async (formData) => {
          "use server";
          await addCustomerNote(customer.id, String(formData.get("body") || ""));
        }}
      >
        <label className="text-sm">Nota interna
          <textarea name="body" required className="mt-1 h-24 w-full border border-input p-2" />
        </label>
        <Button type="submit">Guardar nota</Button>
      </form>
    </div>
  );
}
