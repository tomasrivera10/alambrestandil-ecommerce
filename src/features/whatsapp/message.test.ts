import { describe, expect, it } from "vitest";
import { buildOrderWhatsappMessage, whatsappUrl } from "@/features/whatsapp/message";

describe("mensaje de WhatsApp", () => {
  it("arma un pedido legible con número AT", () => {
    const message = buildOrderWhatsappMessage({
      number: 1048,
      lines: [{ name: "Tejido romboidal 1,80 m", quantity: 2, unit: "ROLLO" }],
      locality: "Tandil",
      fulfillment: "RETIRO",
      notes: "Retiro el sábado",
      estimatedTotal: null,
    });

    expect(message).toContain("pedido AT-1048");
    expect(message).toContain("2 rollos");
    expect(message).toContain("retiro en local");
    expect(message).toContain("Total estimado: A confirmar");
    expect(message).toContain("Retiro el sábado");
  });

  it("abre wa.me con el texto codificado", () => {
    const url = whatsappUrl("549 249 421-4973", "Hola");
    expect(url.startsWith("https://wa.me/5492494214973?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1] ?? "")).toBe("Hola");
  });
});
