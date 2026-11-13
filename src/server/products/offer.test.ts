import { describe, expect, it } from "vitest";
import { activeOffer } from "./offer";

describe("promotional price", () => {
  const now = new Date("2026-11-12T12:00:00-03:00");
  it("applies only within the configured dates", () => {
    expect(
      activeOffer(
        100,
        80,
        new Date("2026-11-12T00:00:00-03:00"),
        new Date("2026-11-12T23:59:59-03:00"),
        now,
      ),
    ).toBe(80);
    expect(activeOffer(100, 80, new Date("2026-11-13T00:00:00-03:00"), null, now)).toBeNull();
    expect(activeOffer(100, 80, null, new Date("2026-11-11T23:59:59-03:00"), now)).toBeNull();
  });
  it("rejects an invalid discount", () => {
    expect(activeOffer(100, 100, null, null, now)).toBeNull();
    expect(activeOffer(null, 80, null, null, now)).toBeNull();
  });
});
