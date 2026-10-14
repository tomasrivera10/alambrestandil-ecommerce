import { describe, expect, it } from "vitest";
import { buildSupplierReviewPlan, COMPANY_STOCK_SOURCE } from "./review-plan";

const variants = [
  {
    id: "stock-roll",
    name: 'Tejido Rombo 2½" 10M X 1.50M C/16',
    unit: "ROLLO",
    sourceReference: `${COMPANY_STOCK_SOURCE}A4:B4`,
  },
  { id: "other", name: 'Tejido Rombo 1½" 10M X 1.50M C/16', unit: "ROLLO", sourceReference: null },
];

describe("supplier bulk review", () => {
  it("matches only the exact presentation carried in the company workbook", () => {
    const plan = buildSupplierReviewPlan(
      [
        { code: "900", name: 'ROLLO 1½" 10M X 1.50M C/16', price: 91908.28 },
        { code: "901", name: 'ROLLO 2½" 10M X 1,50M C/16', price: 53508 },
      ],
      variants,
      [],
    );
    expect(plan.map((row) => row.variantId)).toEqual([null, "stock-roll"]);
  });

  it("holds OCR and duplicate matches for individual review", () => {
    const plan = buildSupplierReviewPlan(
      [
        { code: "1", name: 'ROLLO 2½" 10M X 1.50M C/16', price: 53508, extraction: "ocr" },
        { code: "2", name: 'ROLLO 2½" 10M X 1.50M C/16', price: 53508 },
        { code: "3", name: 'ROLLO 2½" 10M X 1.50M C/16', price: 53508 },
      ],
      variants,
      [],
    );
    expect(plan.every((row) => row.kind === "review")).toBe(true);
  });
});
