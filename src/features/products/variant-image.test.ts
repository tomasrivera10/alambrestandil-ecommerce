import { describe, expect, it } from "vitest";
import { variantImageIndex } from "./variant-image";
const images = [
  { url: "/poste-recto.png", alt: "Poste de hormigón recto" },
  { url: "/poste-olimpico.png", alt: "Poste de hormigón olímpico" },
  { url: "/obra.jpg", alt: "Postes en obra" },
];
const variant = (name: string) => ({ name, sku: "AT-XLS-058", attributes: {} });
describe("variantImageIndex", () => {
  it("matches the selected post shape regardless of accents or capitalization", () => {
    expect(variantImageIndex(images, variant("POSTE ESQUINERO 2M OLIMPICO"))).toBe(1);
    expect(variantImageIndex(images, variant("Poste intermedio olímpico"))).toBe(1);
    expect(variantImageIndex(images, variant("POSTE ESQUINERO 1,50M RECTO"))).toBe(0);
  });
  it("uses attributes to identify shape", () => {
    expect(
      variantImageIndex(images, { ...variant("Poste"), attributes: { tipo: "Olímpico" } }),
    ).toBe(1);
  });
  it("prefers an exact SKU image over a general shape", () => {
    expect(
      variantImageIndex(
        [...images, { url: "/exact.jpg", alt: "Poste AT-XLS-058" }],
        variant("Poste olímpico"),
      ),
    ).toBe(3);
  });
  it("falls back to the general photograph when no specific image exists", () => {
    expect(variantImageIndex(images.slice(0, 1), variant("Poste olímpico"))).toBe(0);
    expect(variantImageIndex(images, variant("Tejido 2m"))).toBe(0);
    expect(variantImageIndex([], variant("Poste recto"))).toBe(0);
  });
});
