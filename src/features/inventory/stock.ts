export type StockState = {
  onHand: number;
  reserved: number;
};

export type MovementType =
  | "ENTRADA"
  | "VENTA"
  | "AJUSTE"
  | "DEVOLUCION"
  | "RESERVA"
  | "CANCELACION";

export function availableStock(state: StockState) {
  return roundQuantity(state.onHand - state.reserved);
}

export function roundQuantity(value: number) { return Math.round(value * 1000) / 1000; }

export function applyStock(
  state: StockState,
  type: MovementType,
  quantity: number,
): StockState {
  if (!Number.isFinite(quantity) || quantity === 0) {
    throw new Error("La cantidad del movimiento tiene que ser distinta de cero.");
  }

  const amount = roundQuantity(quantity);
  if (amount === 0) throw new Error("La cantidad mínima es 0,001.");
  const abs = Math.abs(amount);

  switch (type) {
    case "ENTRADA":
    case "DEVOLUCION":
      return { ...state, onHand: roundQuantity(state.onHand + abs) };
    case "AJUSTE":
      return { ...state, onHand: roundQuantity(state.onHand + amount) };
    case "RESERVA": {
      if (availableStock(state) < abs) {
        throw new Error("No hay stock disponible para reservar.");
      }
      return { ...state, reserved: roundQuantity(state.reserved + abs) };
    }
    case "CANCELACION":
      return { ...state, reserved: Math.max(0, roundQuantity(state.reserved - abs)) };
    case "VENTA": {
      const reserved = Math.max(0, roundQuantity(state.reserved - abs));
      return { onHand: roundQuantity(state.onHand - abs), reserved };
    }
    default:
      throw new Error("Tipo de movimiento inválido.");
  }
}
