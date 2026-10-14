import type { ImportedRow } from "./parse";

export const COMPANY_STOCK_SOURCE = "Alambres Tandil.xlsx · Stock!";

export type ReviewVariant = {
  id: string;
  name: string;
  unit: string;
  sourceReference: string | null;
};

export type PreviousSupplierItem = {
  code: string;
  name: string;
  unit: string | null;
  variantId: string | null;
};

function identity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/½/g, ".5")
    .replace(/\bTEJIDO\s+ROMBO(?:IDAL)?\b/g, "")
    .replace(/\bROLLO\b/g, "")
    .replace(/\bPULGADAS?\b|[“”"″]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\d+(?:\.\d+)?/g, (number) => String(Number(number)))
    .replace(/[^A-Z0-9./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unitFits(row: ImportedRow, variant: ReviewVariant) {
  if (row.unit && identity(row.unit) !== identity(variant.unit)) return false;
  if (/^\s*ROLLO\b/i.test(row.name) && variant.unit !== "ROLLO") return false;
  return true;
}

export function buildSupplierReviewPlan(
  rows: ImportedRow[],
  variants: ReviewVariant[],
  previous: PreviousSupplierItem[],
) {
  const eligible = variants.filter((variant) =>
    variant.sourceReference?.startsWith(COMPANY_STOCK_SOURCE),
  );
  const byId = new Map(eligible.map((variant) => [variant.id, variant]));
  const byCode = new Map(previous.map((item) => [item.code, item]));
  const duplicateCodes = new Set<string>();
  const seenCodes = new Set<string>();
  for (const row of rows) {
    if (seenCodes.has(row.code)) duplicateCodes.add(row.code);
    seenCodes.add(row.code);
  }
  const proposed = rows.map((row, index) => {
    if (row.excluded) return { index, kind: "excluded" as const, variantId: null };
    if (
      !row.code ||
      !row.name ||
      row.price == null ||
      row.price <= 0 ||
      duplicateCodes.has(row.code)
    ) {
      return { index, kind: "review" as const, variantId: null };
    }
    const confirmed = row.variantId ? byId.get(row.variantId) : null;
    if (confirmed && !row.warning && unitFits(row, confirmed)) {
      return { index, kind: "confirmed" as const, variantId: confirmed.id };
    }
    if (row.extraction === "ocr") return { index, kind: "review" as const, variantId: null };
    const matches = eligible.filter(
      (variant) => unitFits(row, variant) && identity(row.name) === identity(variant.name),
    );
    const prior = byCode.get(row.code);
    const priorVariant = prior?.variantId ? byId.get(prior.variantId) : null;
    if (
      priorVariant &&
      identity(prior!.name) === identity(row.name) &&
      identity(prior!.unit ?? "") === identity(row.unit ?? "") &&
      unitFits(row, priorVariant)
    ) {
      return { index, kind: "exact" as const, variantId: priorVariant.id };
    }
    if (matches.length === 1) {
      return { index, kind: "exact" as const, variantId: matches[0].id };
    }
    return { index, kind: "review" as const, variantId: null };
  });
  const counts = new Map<string, number>();
  for (const item of proposed) {
    if (item.variantId) counts.set(item.variantId, (counts.get(item.variantId) ?? 0) + 1);
  }
  return proposed.map((item) =>
    item.variantId && counts.get(item.variantId)! > 1
      ? { index: item.index, kind: "review" as const, variantId: null }
      : item,
  );
}
