import { requireArea } from "@/server/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { formatOrderNumber } from "@/lib/format";
import { StatusLabel } from "@/components/admin/status-label";
import { OrderWorkspaceDetail } from "@/components/admin/order-workspace-detail";
import Link from "next/link";

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

  return (
    <main className="admin-page workspace-page ">
      <Link href="/admin/pedidos" className="admin-back">
        Volver a pedidos
      </Link>
      <h1 className="font-heading text-3xl">{formatOrderNumber(order.number)}</h1>
      <p className="mt-2 text-sm">
        {order.customer.name} · {order.customer.phone} · <StatusLabel value={order.status} />
      </p>
      <OrderWorkspaceDetail order={order} />
    </main>
  );
}
