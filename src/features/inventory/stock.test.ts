import { describe, expect, it } from "vitest";
import { applyStock, availableStock } from "@/features/inventory/stock";

const base = { onHand: 10, reserved: 2 };

describe("applyStock", () => {
  it("conserva fracciones de kg y metros sin truncar ni acumular errores",()=>{
    expect(applyStock({onHand:1.5,reserved:0.2},"RESERVA",0.3)).toEqual({onHand:1.5,reserved:0.5});
    expect(applyStock({onHand:0.3,reserved:0},"VENTA",0.1)).toEqual({onHand:0.2,reserved:0});
    expect(()=>applyStock(base,"ENTRADA",0.0001)).toThrow();
  });
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
