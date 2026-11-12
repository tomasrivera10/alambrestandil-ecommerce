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

const doors = [
  {
    id: "door",
    name: "PUERTA 0,90 X1M",
    unit: "UNIDAD",
    sourceReference: `${COMPANY_STOCK_SOURCE}A1`,
  },
];
const priorDoor = {
  code: "MT-old",
  name: "PUERTA 0.90 X 1.00",
  unit: "UNIDAD",
  variantId: "door",
  listPrice: 100,
};

describe("exception review safety", () => {
  it("normalizes decimal separators, metres and spaced headings", () => {
    expect(
      buildSupplierReviewPlan(
        [
          {
            code: "MT-new",
            name: "P U E R T A 0.9 X 1.00",
            price: 110,
            warning: "Verificar lectura visual y unidad",
          },
        ],
        doors,
        [priorDoor],
      )[0],
    ).toMatchObject({
      kind: "exact",
      variantId: "door",
      supplierCode: "MT-old",
      previousPrice: 100,
    });
  });
  it("never collapses different dimensions or accessories", () => {
    for (const name of [
      "PUERTA 0.9 X 1.20",
      "PUERTA 0.9 X 1 C/PINCHE",
      "PORTON 0.9 X 1",
      "PUERTA 90 X 100",
    ]) {
      expect(
        buildSupplierReviewPlan([{ code: "new", name, price: 100 }], doors, [priorDoor])[0].kind,
      ).toBe("review");
    }
  });
  it("requires individual confirmation for large increases and decreases", () => {
    for (const price of [126, 74]) {
      expect(
        buildSupplierReviewPlan([{ code: "MT-new", name: priorDoor.name, price }], doors, [
          priorDoor,
        ])[0],
      ).toMatchObject({ kind: "review", previousPrice: 100 });
    }
  });
  it("accepts a manually reviewed anomaly but never an unreviewed OCR row", () => {
    const row = {
      code: "new",
      name: priorDoor.name,
      price: 200,
      extraction: "ocr" as const,
      variantId: "door",
    };
    expect(buildSupplierReviewPlan([row], doors, [priorDoor])[0].kind).toBe("review");
    expect(
      buildSupplierReviewPlan([{ ...row, reviewed: true, unit: "UNIDAD" }], doors, [priorDoor])[0]
        .kind,
    ).toBe("confirmed");
  });
  it("rejects conflicting remembered links, reused codes and units", () => {
    const row = { code: "MT-new", name: priorDoor.name, price: 100 };
    expect(
      buildSupplierReviewPlan([row], doors, [priorDoor, { ...priorDoor, code: "other" }])[0].kind,
    ).toBe("review");
    expect(
      buildSupplierReviewPlan([{ ...row, code: priorDoor.code }], doors, [
        { ...priorDoor, name: "PUERTA 2 X 1" },
      ])[0].kind,
    ).toBe("review");
    expect(buildSupplierReviewPlan([{ ...row, unit: "ROLLO" }], doors, [priorDoor])[0].kind).toBe(
      "review",
    );
  });
});

it("recognizes decimal digit spacing without guessing O as zero", () => {
  const variant = [{ ...doors[0], name: "PUERTA 0.90 X1,8M" }];
  expect(
    buildSupplierReviewPlan(
      [{ code: "MT-new", name: "P U E R T A 0.9 0 X 1.8 0", price: 100 }],
      variant,
      [],
    )[0].kind,
  ).toBe("exact");
  expect(
    buildSupplierReviewPlan(
      [{ code: "MT-new", name: "P U E R T A O.9 0 X 1.8 0", price: 100 }],
      variant,
      [],
    )[0].kind,
  ).toBe("review");
});

it("offers reversed gate dimensions as a proposal requiring confirmation", () => {
  const stock = [{ ...doors[0], id: "gate", name: "PORTON 1.80 X3M" }];
  expect(
    buildSupplierReviewPlan(
      [{ code: "MT-gate", name: "PORTON 3 X 1.80", price: 100, extraction: "verified" }],
      stock,
      [],
    )[0],
  ).toMatchObject({ kind: "review", variantId: null, suggestedVariantIds: ["gate"] });
});
it("does not consider a reviewed USD amount ready for approval", () => {
  expect(
    buildSupplierReviewPlan(
      [
        {
          code: "MT-door",
          name: doors[0].name,
          price: 10,
          currency: "USD",
          reviewed: true,
          variantId: "door",
        },
      ],
      doors,
      [],
    )[0].kind,
  ).toBe("review");
});
