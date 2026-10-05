const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return money.format(value);
}

export function formatOrderNumber(number: number) {
  return `AT-${number}`;
}

export function formatQuoteNumber(number: number) {
  return `CT-${number}`;
}

const UNIT_LABEL: Record<string, string> = {
  UNIDAD: "unidades",
  METRO: "metros",
  ROLLO: "rollos",
  KG: "kg",
  PAQUETE: "paquetes",
  PANEL: "paneles",
  JUEGO: "juegos",
};

export function unitLabel(unit: string, quantity = 2) {
  if (quantity === 1) {
    const singular: Record<string, string> = {
      UNIDAD: "unidad",
      METRO: "metro",
      ROLLO: "rollo",
      KG: "kg",
      PAQUETE: "paquete",
      PANEL: "panel",
      JUEGO: "juego",
    };
    return singular[unit] ?? unit.toLowerCase();
  }
  return UNIT_LABEL[unit] ?? unit.toLowerCase();
}

export function decimalToNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) return null;
  return typeof value === "number" ? value : value.toNumber();
}
