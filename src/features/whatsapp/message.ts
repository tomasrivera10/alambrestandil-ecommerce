import { formatMoney, formatOrderNumber, unitLabel } from "@/lib/format";

export type WhatsappLine = {
  name: string;
  quantity: number;
  unit: string;
};

export type WhatsappOrderInput = {
  number: number;
  lines: WhatsappLine[];
  locality: string;
  fulfillment: "RETIRO" | "ENVIO";
  notes?: string | null;
  estimatedTotal: number | null;
};

export function buildOrderWhatsappMessage(input: WhatsappOrderInput) {
  const items = input.lines
    .map((line) => {
      const qty = Number.isInteger(line.quantity)
        ? String(line.quantity)
        : String(line.quantity);
      return `• ${line.name}\n  ${qty} ${unitLabel(line.unit, line.quantity)}`;
    })
    .join("\n\n");

  const modality = input.fulfillment === "ENVIO" ? "envío" : "retiro en local";
  const total =
    input.estimatedTotal == null
      ? "A confirmar"
      : formatMoney(input.estimatedTotal) ?? "A confirmar";

  const lines = [
    "Hola Alambres Tandil.",
    "",
    `Quiero consultar por el pedido ${formatOrderNumber(input.number)}.`,
    "",
    items,
    "",
    `Entrega: ${input.locality}`,
    `Modalidad: ${modality}`,
  ];

  if (input.notes?.trim()) {
    lines.push("", "Observaciones:", input.notes.trim());
  }

  lines.push("", `Total estimado: ${total}`, "", "Quedo atento a disponibilidad y precio final.");
  return lines.join("\n");
}

export function whatsappUrl(phoneDigits: string, message: string) {
  const digits = phoneDigits.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
