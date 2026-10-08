type Image = { url: string; alt: string };
type Variant = { name: string; sku: string; attributes: Record<string, string> };
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Only use identifiable image subjects; dimensions alone do not identify a photograph. */
export function variantImageIndex(images: Image[], variant?: Variant): number {
  if (!variant) return 0;
  const sku = normalize(variant.sku);
  const exact = images.findIndex(
    (image) =>
      sku &&
      normalize(image.alt)
        .split(/[^a-z0-9-]+/)
        .includes(sku),
  );
  if (exact >= 0) return exact;
  const description = normalize(`${variant.name} ${Object.values(variant.attributes).join(" ")}`);
  for (const type of ["olimpico", "recto"]) {
    if (!new RegExp(`\\b${type}\\b`).test(description)) continue;
    const index = images.findIndex((image) =>
      new RegExp(`\\b${type}\\b`).test(normalize(`${image.alt} ${image.url.replaceAll("-", " ")}`)),
    );
    if (index >= 0) return index;
  }
  return 0;
}
