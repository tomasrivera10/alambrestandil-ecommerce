import studio from "@/content/catalog-studio.json";
import { variantImageIndex } from "./variant-image";

/** Refresh legacy persisted thumbnails without changing cart quantities or commercial data. */
export function cartImageUrl(line: { href: string; variantName: string; imageUrl: string | null }) {
  if (
    line.imageUrl &&
    (!line.imageUrl.startsWith("/images/") || line.imageUrl.startsWith("/images/productos-reales/"))
  ) {
    return line.imageUrl;
  }
  const slug = line.href.split("?")[0].split("/").filter(Boolean).at(-1);
  if (!slug || !(slug in studio.products)) return line.imageUrl;
  const images = studio.products[slug as keyof typeof studio.products].map(
    (key) => studio.assets[key as keyof typeof studio.assets],
  );
  return (
    images[variantImageIndex(images, { name: line.variantName, sku: "", attributes: {} })]?.url ??
    line.imageUrl
  );
}
