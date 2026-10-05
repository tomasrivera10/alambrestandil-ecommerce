import { describe, expect, it } from "vitest";
import { ESTIMATE_DISCLAIMER, estimateFence } from "@/features/quotes/estimate";

describe("estimación de cerco", () => {
  it("estima postes cada 2,50 m y rollos de 10 m", () => {
    const lines = estimateFence({
      terrain: "lote",
      meters: 25,
      height: 1.8,
      mesh: "romboidal",
      post: "olimpico",
      gate: "economico",
      install: false,
    });
    const posts = lines.find((line) => line.name.includes("olímpico"));
    const mesh = lines.find((line) => line.unit === "ROLLO" && line.name.includes("romboidal"));
    expect(posts?.quantity).toBe(Math.ceil(25 / 2.5) + 1);
    expect(mesh?.quantity).toBe(3);
    expect(ESTIMATE_DISCLAIMER.toLowerCase()).toContain("estimaci");
  });
});