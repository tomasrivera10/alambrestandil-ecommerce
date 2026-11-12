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
  listPrice?: number | null;
};

export const COST_CHANGE_LIMIT = 25;

export function supplierIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/½/g, ".5")
    .replace(/\b(?:[A-Z]\s+){2,}[A-Z]\b/g, (word) => word.replace(/\s/g, ""))
    .replace(/\bTEJIDO\s+ROMBO(?:IDAL)?\b/g, "")
    .replace(/\bROLLO\b/g, "")
    .replace(/\bPULGADAS?\b|[“”"″]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d\.\d+)\s+(?=\d(?:\s|$))/g, "$1")
    .replace(/\d+(?:\.\d+)?/g, (number) => String(Number(number)))
    .replace(/(\d)\s*M\b/g, "$1")
    .replace(/(\d)\s*X\s*(?=\d)/g, "$1 X ")
    .replace(/[^A-Z0-9./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unitFits(row: ImportedRow, variant: ReviewVariant) {
  if (row.unit && supplierIdentity(row.unit) !== supplierIdentity(variant.unit)) return false;
  if (/^\s*ROLLO\b/i.test(row.name) && variant.unit !== "ROLLO") return false;
  return true;
}

export type SupplierReviewDecision = {
  index: number;
  kind: "excluded" | "review" | "confirmed" | "exact";
  variantId: string | null;
  reason?: string;
  previousPrice?: number | null;
  changePercent?: number | null;
  supplierCode?: string;
  suggestedVariantIds?: string[];
};

export function buildSupplierReviewPlan(
  rows: ImportedRow[],
  variants: ReviewVariant[],
  previous: PreviousSupplierItem[],
): SupplierReviewDecision[] {
  const eligible = variants.filter((variant) =>
    variant.sourceReference?.startsWith(COMPANY_STOCK_SOURCE),
  );
  const byId = new Map(eligible.map((variant) => [variant.id, variant]));

  const duplicateCodes = new Set<string>();
  const seenCodes = new Set<string>();
  for (const row of rows) {
    if (row.excluded) continue;
    if (seenCodes.has(row.code)) duplicateCodes.add(row.code);
    seenCodes.add(row.code);
  }
  const proposed = rows.map<SupplierReviewDecision>((row, index) => {
    if (row.excluded) return { index, kind: "excluded" as const, variantId: null };
    if (
      !row.code ||
      !row.name ||
      row.price == null ||
      !Number.isFinite(row.price) ||
      row.price <= 0 ||
      duplicateCodes.has(row.code)
    ) {
      return { index, kind: "review" as const, variantId: null };
    }
    const priorMatches = previous.filter(
      (item) =>
        item.variantId &&
        byId.has(item.variantId) &&
        supplierIdentity(item.name) === supplierIdentity(row.name) &&
        (!row.unit || supplierIdentity(item.unit ?? "") === supplierIdentity(row.unit)),
    );
    if (priorMatches.length > 1 && !row.reviewed)
      return {
        index,
        kind: "review" as const,
        variantId: null,
        reason: "Hay varios vínculos anteriores posibles",
      };
    const reusedCode = previous.find((item) => item.code === row.code);
    if (
      reusedCode &&
      supplierIdentity(reusedCode.name) !== supplierIdentity(row.name) &&
      !row.reviewed
    )
      return {
        index,
        kind: "review" as const,
        variantId: null,
        reason: "El código del proveedor cambió de descripción",
      };
    const prior = priorMatches.length === 1 ? priorMatches[0] : undefined;
    if (
      prior &&
      prior.code !== row.code &&
      !(/^(MT|AUTO)-/.test(prior.code) && /^(MT|AUTO)-/.test(row.code)) &&
      !row.reviewed
    )
      return {
        index,
        kind: "review",
        variantId: null,
        reason: "Cambió el código del proveedor: confirmá la asociación",
      };
    const previousPrice = prior?.listPrice ?? null;
    const changePercent =
      previousPrice && row.price != null ? (row.price / previousPrice - 1) * 100 : null;
    const exactCandidates = eligible.filter(
      (variant) =>
        unitFits(row, variant) && supplierIdentity(row.name) === supplierIdentity(variant.name),
    );
    const door = (name: string) =>
      supplierIdentity(name).match(/^(PUERTA|PORTON) (\d+(?:\.\d+)?) X (\d+(?:\.\d+)?)(.*)$/);
    const sourceDoor = door(row.name);
    const suggestions = eligible.filter((variant) => {
      if (!unitFits(row, variant)) return false;
      if (exactCandidates.some((candidate) => candidate.id === variant.id)) return true;
      const target = door(variant.name);
      return (
        sourceDoor &&
        target &&
        sourceDoor[1] === target[1] &&
        sourceDoor[2] === target[3] &&
        sourceDoor[3] === target[2] &&
        sourceDoor[4] === target[4]
      );
    });
    const details = {
      previousPrice,
      changePercent,
      supplierCode: prior?.code,
      suggestedVariantIds: suggestions.map((variant) => variant.id),
    };
    const confirmed = row.variantId ? byId.get(row.variantId) : null;
    const reviewed =
      row.reviewed === true ||
      (row.reviewed === undefined && !!row.variantId && !row.warning && row.extraction !== "ocr");
    if (row.currency && row.currency !== "ARS")
      return {
        index,
        kind: "review",
        variantId: null,
        reason: "Costo en USD: requiere conversión explícita a ARS",
        ...details,
      };
    if (confirmed && reviewed && !row.warning && unitFits(row, confirmed)) {
      return { index, kind: "confirmed" as const, variantId: confirmed.id, ...details };
    }
    if (row.extraction === "ocr")
      return {
        index,
        kind: "review" as const,
        variantId: null,
        reason: "Lectura OCR: verificá el original",
        ...details,
      };
    if (changePercent != null && Math.abs(changePercent) > COST_CHANGE_LIMIT)
      return {
        index,
        kind: "review" as const,
        variantId: null,
        reason: `El costo varía más del ${COST_CHANGE_LIMIT}%`,
        ...details,
      };
    const routineWarnings = [
      "Verificar lectura visual y unidad",
      "Verificar costo, unidad y presentación",
    ];
    if (row.warning && !routineWarnings.includes(row.warning))
      return { index, kind: "review" as const, variantId: null, reason: row.warning, ...details };
    const priorVariant = prior?.variantId ? byId.get(prior.variantId) : null;
    if (priorVariant && unitFits(row, priorVariant))
      return {
        index,
        kind: "exact" as const,
        variantId: priorVariant.id,
        reason: "Vínculo recordado",
        ...details,
      };
    const matches = eligible.filter(
      (variant) =>
        unitFits(row, variant) && supplierIdentity(row.name) === supplierIdentity(variant.name),
    );
    if (matches.length === 1) {
      return {
        index,
        kind: "exact" as const,
        variantId: matches[0].id,
        reason: "Producto y medidas coinciden",
        ...details,
      };
    }
    return {
      index,
      kind: "review" as const,
      variantId: null,
      reason:
        matches.length > 1 || priorMatches.length > 1
          ? "Hay varios vínculos posibles"
          : suggestions.length === 1
            ? "Medidas en distinto orden: confirmá ancho y alto"
            : "Sin coincidencia segura",
      ...details,
    };
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
