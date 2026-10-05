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
  return state.onHand - state.reserved;
}

export function applyStock(
  state: StockState,
  type: MovementType,
  quantity: number,
): StockState {
  if (!Number.isFinite(quantity) || quantity === 0) {
    throw new Error("La cantidad del movimiento tiene que ser distinta de cero.");
  }

  const abs = Math.abs(Math.trunc(quantity));

  switch (type) {
    case "ENTRADA":
    case "DEVOLUCION":
      return { ...state, onHand: state.onHand + abs };
    case "AJUSTE":
      return { ...state, onHand: state.onHand + Math.trunc(quantity) };
    case "RESERVA": {
      if (availableStock(state) < abs) {
        throw new Error("No hay stock disponible para reservar.");
      }
      return { ...state, reserved: state.reserved + abs };
    }
    case "CANCELACION":
      return { ...state, reserved: Math.max(0, state.reserved - abs) };
    case "VENTA": {
      const reserved = Math.max(0, state.reserved - abs);
      return { onHand: state.onHand - abs, reserved };
    }
    default:
      return state;
  }
}
