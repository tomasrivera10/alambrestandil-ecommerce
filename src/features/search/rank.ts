export type SearchFields = {
  name: string;
  sku?: string | null;
  category?: string | null;
  attributes?: string;
  description?: string | null;
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function normalizeSearch(value: string) {
  return fold(value).replace(/[^a-z0-9.\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function rankSearchHit(query: string, fields: SearchFields) {
  const q = normalizeSearch(query);
  if (!q) return 0;
  const tokens = q.split(" ");
  const name = normalizeSearch(fields.name);
  const sku = normalizeSearch(fields.sku ?? "");
  const category = normalizeSearch(fields.category ?? "");
  const attributes = normalizeSearch(fields.attributes ?? "");
  const description = normalizeSearch(fields.description ?? "");

  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 80;
  if (name.includes(q)) score += 50;
  if (sku && (sku === q || sku.includes(q))) score += 70;
  if (category.includes(q)) score += 30;
  if (attributes.includes(q)) score += 24;
  if (description.includes(q)) score += 8;

  for (const token of tokens) {
    if (!token) continue;
    if (name.includes(token)) score += 12;
    else if (sku.includes(token)) score += 10;
    else if (category.includes(token)) score += 6;
    else if (attributes.includes(token)) score += 5;
    else if (description.includes(token)) score += 2;
    else score -= 8;
  }

  return score;
}
