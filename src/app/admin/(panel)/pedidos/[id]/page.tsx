import { requireArea } from "@/server/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { formatMoney, formatOrderNumber, unitLabel } from "@/lib/format";
import { nextStatuses } from "@/features/orders/transitions";
import { updateOrderStatus } from "@/server/crm/actions";
import { StatusLabel, statusText } from "@/components/admin/status-label";
import { ActionForm } from "@/components/admin/action-form";
import Link from "next/link";

const actions: Record<string, string> = {
  NUEVO: "Marcar como nuevo",
  ENVIADO_A_WHATSAPP: "Marcar enviado a WhatsApp",
  CONTACTADO: "Marcar contactado",
  COTIZADO: "Marcar presupuestado",
  CONFIRMADO: "Confirmar pedido",
  PREPARANDO: "Comenzar preparación",
  LISTO: "Marcar listo para entregar",
  ENTREGADO: "Registrar entrega",
  CANCELADO: "Cancelar pedido",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("orders");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      history: { orderBy: { createdAt: "asc" }, include: { user: true } },
    },
  });
  if (!order) notFound();
  const next = nextStatuses(order.status);

  return (
    <main className="admin-page workspace-page max-w-3xl">
      <Link href="/admin/pedidos" className="admin-back">
        Volver a pedidos
      </Link>
      <h1 className="font-heading text-3xl">{formatOrderNumber(order.number)}</h1>
      <p className="mt-2 text-sm">
        {order.customer.name} · {order.customer.phone} · <StatusLabel value={order.status} />
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
            <span className="font-mono">
              {item.lineTotal ? formatMoney(Number(item.lineTotal)) : "A confirmar"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-sm">
        Total estimado:{" "}
        {order.estimatedTotal ? formatMoney(Number(order.estimatedTotal)) : "A confirmar"}
      </p>
      {next.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {next.map((status) => (
            <ActionForm
              key={status}
              action={async () => {
                "use server";
                await updateOrderStatus(order.id, status);
              }}
            >
              <button type="submit" className="admin-button-secondary">
                {actions[status] ?? statusText(status)}
              </button>
            </ActionForm>
          ))}
        </div>
      ) : null}
      <h2 className="mt-10 font-heading text-xl">Historial</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {order.history.map((entry) => (
          <li key={entry.id}>
            {entry.fromStatus ? statusText(entry.fromStatus) : "Inicio"} →{" "}
            {statusText(entry.toStatus)}
            {entry.note ? ` · ${entry.note}` : ""}
          </li>
        ))}
      </ol>
    </main>
  );
}
