import { expect, it } from "vitest";
import { mergeReprocessedRows } from "./reprocess";

it("preserves a confirmed association only when page, description and cost agree", () => {
  const previous = [
    { code: "old", name: "PUERTA 0.90 X1M", price: 100, page: 3, variantId: "v", reviewed: true },
  ];
  expect(
    mergeReprocessedRows(previous, [
      { code: "new", name: "PUERTA 0,90 X1.00", price: 100, page: 3, extraction: "verified" },
    ]),
  ).toEqual([
    expect.objectContaining({
      code: "old",
      variantId: "v",
      reviewed: true,
      extraction: "verified",
    }),
  ]);
});
it("does not silently discard a previous human decision when the new reading differs", () => {
  const previous = [
    { code: "old", name: "PUERTA 0.9 X1M", price: 99, page: 3, variantId: "v", reviewed: true },
  ];
  const rows = mergeReprocessedRows(previous, [
    { code: "new", name: "PUERTA 0.9 X1M", price: 100, page: 3 },
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0].variantId).toBeUndefined();
  expect(rows[1]).toMatchObject({ code: "old", price: 99, reviewed: false, variantId: "v" });
  expect(rows[1].warning).toContain("Decisión anterior");
});
it("does not arbitrarily transfer decisions to duplicate extracted names", () => {
  const old = [
    { code: "1", name: "PUERTA 1 X2M", price: 100, page: 3, variantId: "v", reviewed: true },
    { code: "2", name: "PUERTA 1 X2M", price: 100, page: 3, variantId: "w", reviewed: true },
  ];
  const rows = mergeReprocessedRows(old, [
    { code: "new", name: "PUERTA 1 X2M", price: 100, page: 3 },
  ]);
  expect(rows[0].variantId).toBeUndefined();
  expect(rows).toHaveLength(3);
});

it("does not copy a confirmation to two new duplicate source rows", () => {
  const old = [
    { code: "old", name: "PUERTA 1 X2M", price: 100, page: 3, variantId: "v", reviewed: true },
  ];
  const row = { code: "new", name: "PUERTA 1 X2M", price: 100, page: 3 };
  const result = mergeReprocessedRows(old, [row, { ...row, code: "other" }]);
  expect(result.slice(0, 2).every((item) => !item.variantId)).toBe(true);
});
