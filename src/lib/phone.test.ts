import { describe, expect, it } from "vitest";
import { formatOrderNumber, formatQuoteNumber } from "@/lib/format";
import { isPlausiblePhone, normalizeArPhone } from "@/lib/phone";

describe("teléfono y números", () => {
  it("normaliza teléfonos argentinos", () => {
    expect(normalizeArPhone("249 421-4973")).toBe("542494214973");
    expect(normalizeArPhone("+54 9 249 421-4973")).toBe("5492494214973");
    expect(isPlausiblePhone("2494214973")).toBe(true);
    expect(isPlausiblePhone("123")).toBe(false);
  });

  it("formatea pedidos y cotizaciones", () => {
    expect(formatOrderNumber(1048)).toBe("AT-1048");
    expect(formatQuoteNumber(2001)).toBe("CT-2001");
  });
});
