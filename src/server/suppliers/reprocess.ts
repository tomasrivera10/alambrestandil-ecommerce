import type { ImportedRow } from "./parse";
import { supplierIdentity } from "./review-plan";

/** Never silently transfer a human decision to a changed description or cost. */
export function mergeReprocessedRows(
  previous: ImportedRow[],
  extracted: ImportedRow[],
): ImportedRow[] {
  const used = new Set<number>();
  const key = (row: ImportedRow) =>
    JSON.stringify([row.page, supplierIdentity(row.name), row.price]);
  const counts = new Map<string, number>();
  for (const row of extracted) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  const rows = extracted.map((row) => {
    const matches = previous
      .map((old, index) => ({ old, index }))
      .filter(
        ({ old, index }) =>
          !used.has(index) &&
          old.page === row.page &&
          old.price === row.price &&
          (old.currency ?? "ARS") === (row.currency ?? "ARS") &&
          (!old.unit || !row.unit || supplierIdentity(old.unit) === supplierIdentity(row.unit)) &&
          supplierIdentity(old.name) === supplierIdentity(row.name),
      );
    if (matches.length !== 1 || counts.get(key(row)) !== 1) return row;
    const { old, index } = matches[0];
    used.add(index);
    if (!old.reviewed && !old.variantId && !old.excluded) return row;
    return {
      ...row,
      code: old.code,
      variantId: old.variantId,
      unit: old.unit ?? row.unit,
      excluded: old.excluded,
      reviewed: old.reviewed ?? (!!old.variantId && !old.warning),
      ...(old.variantId && !old.warning ? { warning: undefined } : {}),
    };
  });
  previous.forEach((old, index) => {
    if (used.has(index) || (!old.reviewed && !old.variantId && !old.excluded)) return;
    const kept = { ...old };
    delete kept.readBackup;
    rows.push({
      ...kept,
      reviewed: false,
      warning:
        "Decisión anterior sin coincidencia inequívoca en la nueva lectura. Revisá o excluí esta fila.",
    });
  });
  return rows;
}
