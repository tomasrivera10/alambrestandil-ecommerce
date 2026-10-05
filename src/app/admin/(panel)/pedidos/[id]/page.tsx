import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatOrderNumber, unitLabel } from "@/lib/format";
import { nextStatuses } from "@/features/orders/transitions";
import { updateOrderStatus } from "@/features/crm/actions";
import { Button } from "@/components/ui/button";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: true, history: { orderBy: { createdAt: "asc" }, include: { user: true } } },
  });
  if (!order) notFound();
  const next = nextStatuses(order.status);

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl">{formatOrderNumber(order.number)}</h1>
      <p className="mt-2 text-sm">
        {order.customer.name} · {order.customer.phone} · {order.status}
      </p>
      <ul className="mt-6 divide-y divide-border border-y border-border text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>
              {item.name}
              <span className="block text-muted-foreground">
                {Number(item.quantity)} {unitLabel(item.unit, Number(item.quantity))}
              </span>
            </span>
            <span className="font-mono">{item.lineTotal ? formatMoney(Number(item.lineTotal)) : "A confirmar"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-sm">
        Total estimado: {order.estimatedTotal ? formatMoney(Number(order.estimatedTotal)) : "A confirmar"}
      </p>
      {next.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {next.map((status) => (
            <form
              key={status}
              action={async () => {
                "use server";
                await updateOrderStatus(order.id, status);
              }}
            >
              <Button type="submit" variant="outline">
                {status}
              </Button>
            </form>
          ))}
        </div>
      ) : null}
      <h2 className="mt-10 font-heading text-xl">Historial</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {order.history.map((entry) => (
          <li key={entry.id}>
            {entry.fromStatus ?? "inicio"} → {entry.toStatus}
            {entry.note ? ` · ${entry.note}` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
