const labels: Record<string, string> = {
  NUEVO: "Nuevo",
  ENVIADO_A_WHATSAPP: "Enviado a WhatsApp",
  CONTACTADO: "Contactado",
  COTIZADO: "Presupuestado",
  CONFIRMADO: "Confirmado",
  PREPARANDO: "En preparación",
  LISTO: "Listo para entregar",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  DRAFT: "Borrador",
  NEW: "Nuevo",
  IN_PROGRESS: "En revisión",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};
export function statusText(value: string) {
  return labels[value] ?? value.toLowerCase().replace(/_/g, " ");
}
export function StatusLabel({ value }: { value: string }) {
  return (
    <span
      className={
        ["CANCELADO", "REJECTED", "RECHAZADO"].includes(value)
          ? "admin-badge admin-badge-danger"
          : ["NUEVO", "NEW", "PREPARANDO", "IN_PROGRESS"].includes(value)
            ? "admin-badge-warning"
            : "admin-badge"
      }
    >
      {statusText(value)}
    </span>
  );
}
