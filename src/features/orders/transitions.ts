import type { OrderStatus } from "@/generated/prisma/client";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  BORRADOR: ["NUEVO", "CANCELADO"],
  NUEVO: ["ENVIADO_A_WHATSAPP", "CONTACTADO", "COTIZADO", "CANCELADO"],
  ENVIADO_A_WHATSAPP: ["CONTACTADO", "COTIZADO", "CANCELADO"],
  CONTACTADO: ["COTIZADO", "CONFIRMADO", "CANCELADO"],
  COTIZADO: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["LISTO", "CANCELADO"],
  LISTO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

const RESERVED: OrderStatus[] = ["CONFIRMADO", "PREPARANDO", "LISTO"];

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return NEXT[from].includes(to);
}

export function stockEffect(from: OrderStatus, to: OrderStatus) {
  const wasReserved = RESERVED.includes(from);
  const willReserve = RESERVED.includes(to);
  if (!wasReserved && willReserve) return "RESERVA" as const;
  if (wasReserved && to === "CANCELADO") return "CANCELACION" as const;
  if (wasReserved && to === "ENTREGADO") return "VENTA" as const;
  return null;
}

export function nextStatuses(from: OrderStatus) {
  return NEXT[from];
}
