import { describe, expect, it } from "vitest";
import { rankSearchHit } from "@/features/search/rank";

describe("búsqueda", () => {
  it("prioriza nombre y atributos por encima de una descripción floja", () => {
    const tejido = rankSearchHit("tejido 1.80", {
      name: "Tejido romboidal galvanizado",
      attributes: "altura 1.80 abertura 5 cm",
      description: "Cerco perimetral",
    });
    const poste = rankSearchHit("tejido 1.80", {
      name: "Poste olímpico",
      attributes: "largo 2.40",
      description: "Para tejido",
    });
    expect(tejido).toBeGreaterThan(poste);
    expect(tejido).toBeGreaterThan(0);
  });
});
