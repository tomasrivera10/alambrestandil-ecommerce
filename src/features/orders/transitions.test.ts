import { describe, expect, it } from "vitest";
import { canTransition, stockEffect } from "@/features/orders/transitions";

describe("estados de pedido", () => {
  it("permite el camino comercial y bloquea saltos", () => {
    expect(canTransition("NUEVO", "ENVIADO_A_WHATSAPP")).toBe(true);
    expect(canTransition("COTIZADO", "CONFIRMADO")).toBe(true);
    expect(canTransition("NUEVO", "ENTREGADO")).toBe(false);
    expect(canTransition("ENTREGADO", "CANCELADO")).toBe(false);
  });

  it("reserva al confirmar, vende al entregar y libera al cancelar", () => {
    expect(stockEffect("COTIZADO", "CONFIRMADO")).toBe("RESERVA");
    expect(stockEffect("LISTO", "ENTREGADO")).toBe("VENTA");
    expect(stockEffect("PREPARANDO", "CANCELADO")).toBe("CANCELACION");
    expect(stockEffect("NUEVO", "ENVIADO_A_WHATSAPP")).toBeNull();
    expect(stockEffect("CONFIRMADO", "PREPARANDO")).toBeNull();
  });
});
