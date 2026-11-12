import Link from "next/link";
import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { formatMoney, formatOrderNumber, unitLabel } from "@/lib/format";
import { nextStatuses } from "@/features/orders/transitions";
import { whatsappUrl } from "@/features/whatsapp/message";
import { updateOrderStatus } from "@/server/crm/actions";
import { ActionForm } from "./action-form";
import { statusText } from "./status-label";

type WorkspaceOrder = Prisma.OrderGetPayload<{
  include: { customer: true; items: true; history: { include: { user: true } } };
}>;

export function orderDate(date: Date) {
  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function OrderWorkspaceDetail({ order }: { order: WorkspaceOrder }) {
  const next = nextStatuses(order.status);
  const orderId = order.id;
  const currentStatus = order.status;
  const partial = order.items.some((item) => item.lineTotal == null);
  async function changeStatus(form: FormData) {
    "use server";
    const status = String(form.get("status")) as OrderStatus;
    if (!nextStatuses(currentStatus).includes(status)) throw new Error("Elegí un estado válido.");
    if (
      status === "CANCELADO" &&
      (form.get("confirm") !== "on" || !String(form.get("note") || "").trim())
    )
      throw new Error("Indicá el motivo y confirmá la cancelación.");
    await updateOrderStatus(
      orderId,
      status,
      String(form.get("note") || "")
        .trim()
        .slice(0, 1000) || undefined,
    );
  }
  return (
    <div className="order-detail-grid">
      <section>
        <h2>Productos · {order.items.length}</h2>
        <ul className="order-lines">
          {order.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>
                  SKU: {item.sku || "Sin código"} · {Number(item.quantity).toLocaleString("es-AR")}{" "}
                  {unitLabel(item.unit, Number(item.quantity))}
                </small>
                {item.notes && <p className="order-note">{item.notes}</p>}
              </div>
              <span>
                {item.lineTotal == null ? "A cotizar" : formatMoney(Number(item.lineTotal))}
              </span>
            </li>
          ))}
        </ul>
        <p className="order-total">
          <strong>{partial ? "Subtotal conocido" : "Total estimado"}</strong>
          <strong>
            {order.estimatedTotal == null ? "A cotizar" : formatMoney(Number(order.estimatedTotal))}
          </strong>
        </p>
        <p className="order-help">
          {partial
            ? "Hay productos sin cotizar. El subtotal no es el total final."
            : "Importe estimado, sujeto a confirmación. No indica un pago recibido."}
        </p>
        <h2>Entrega y observaciones</h2>
        <p>
          {order.fulfillment === "ENVIO" ? "Envío a domicilio" : "Retiro en el local"} ·{" "}
          {order.locality || "Localidad sin indicar"}
        </p>
        {order.fulfillment === "ENVIO" && (
          <p className="order-note">{order.address || "Dirección pendiente de confirmar"}</p>
        )}
        <p className="order-note">{order.notes || "Sin observaciones del pedido."}</p>
        <div className="order-contact">
          <Link className="admin-button-secondary" href={`/admin/clientes/${order.customerId}`}>
            Ver cliente
          </Link>
          <a
            className="admin-button-secondary"
            href={`tel:${order.customer.phone.replace(/[^+\d]/g, "")}`}
          >
            Llamar
          </a>
          <a
            className="admin-button-secondary"
            href={whatsappUrl(
              order.customer.phone,
              `Hola ${order.customer.name}, te contactamos de Alambres Tandil por tu pedido ${formatOrderNumber(order.number)}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
      <section>
        <h2>Seguimiento</h2>
        <p className="order-help">
          Recibido: {orderDate(order.createdAt)}
          <br />
          Última actualización: {orderDate(order.updatedAt)}
        </p>
        {next.some((status) => status !== "CANCELADO") && (
          <ActionForm
            action={changeStatus}
            className="order-status-form"
            success="Estado actualizado."
          >
            <label>
              Próximo estado
              <select name="status" required defaultValue="">
                <option value="" disabled>
                  Elegí cómo continuar
                </option>
                {next
                  .filter((status) => status !== "CANCELADO")
                  .map((status) => (
                    <option key={status} value={status}>
                      {statusText(status)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Nota interna (opcional)
              <textarea
                name="note"
                maxLength={1000}
                rows={2}
                placeholder="Dejá contexto para el equipo"
              />
            </label>
            <p className="order-help">Confirmar reserva stock; entregar lo descuenta.</p>
            <button className="admin-button" type="submit">
              Actualizar estado
            </button>
          </ActionForm>
        )}
        {!next.length && <p>Este pedido está cerrado.</p>}
        <details className="order-history">
          <summary>Historial completo ({order.history.length})</summary>
          <ol>
            {order.history.map((entry) => (
              <li key={entry.id}>
                <strong>{statusText(entry.toStatus)}</strong>
                <small>
                  {orderDate(entry.createdAt)} · {entry.user?.name || "Tienda web"}
                </small>
                {entry.note && <p className="order-note">{entry.note}</p>}
              </li>
            ))}
          </ol>
        </details>
        {next.includes("CANCELADO") && (
          <details className="order-cancel">
            <summary>Cancelar pedido</summary>
            <ActionForm action={changeStatus} success="Pedido cancelado.">
              <input type="hidden" name="status" value="CANCELADO" />
              <label>
                Motivo
                <textarea name="note" maxLength={1000} required rows={2} />
              </label>
              <label className="order-confirm">
                <input type="checkbox" name="confirm" required />
                Confirmo la cancelación y la liberación de reservas, si las hay.
              </label>
              <button type="submit" className="admin-button-secondary">
                Confirmar cancelación
              </button>
            </ActionForm>
          </details>
        )}
      </section>
    </div>
  );
}
