import { describe, expect, it } from "vitest";
import { applyStock, availableStock } from "@/features/inventory/stock";

const base = { onHand: 10, reserved: 2 };

describe("applyStock", () => {
  it("calcula disponible como físico menos reservado", () => {
    expect(availableStock(base)).toBe(8);
  });

  it("reserva solo si hay disponible", () => {
    expect(applyStock(base, "RESERVA", 3)).toEqual({ onHand: 10, reserved: 5 });
    expect(() => applyStock(base, "RESERVA", 9)).toThrow(/disponible/);
  });

  it("vende descontando físico y reserva", () => {
    expect(applyStock(base, "VENTA", 2)).toEqual({ onHand: 8, reserved: 0 });
  });

  it("libera reserva al cancelar", () => {
    expect(applyStock(base, "CANCELACION", 2)).toEqual({ onHand: 10, reserved: 0 });
  });

  it("ajuste puede sumar o restar", () => {
    expect(applyStock(base, "AJUSTE", -4)).toEqual({ onHand: 6, reserved: 2 });
    expect(applyStock(base, "ENTRADA", 5)).toEqual({ onHand: 15, reserved: 2 });
  });
});
