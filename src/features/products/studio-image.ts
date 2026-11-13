import studio from "@/content/catalog-studio.json";

/** Use corrected local assets only while the original studio reference is assigned. */
export function currentStudioImage<T extends { url: string; alt: string }>(slug: string, image: T): T {
  if (slug !== "palomita-j" && slug !== "palomita-z") return image;
  const asset = studio.assets[slug];
  return image.url === asset.url ? { ...image, url: asset.localUrl, alt: asset.alt } : image;
}

const woodCatalogImages: Record<string, { url: string; alt: string }> = {
  "palo-de-eucalipto-3m": {
    url: "/images/palo-eucalipto-3m-catalogo.png",
    alt: "Palo de eucalipto de 3 metros sobre fondo transparente",
  },
  "postes-de-quebracho": {
    url: "/images/postes-quebracho-catalogo.png",
    alt: "Poste de quebracho sobre fondo transparente",
  },
};

export function catalogImageForProduct<T extends { url: string; alt: string }>(
  slug: string,
  image: T | null,
): T | { url: string; alt: string; isReference: boolean } | null {
  const catalog = woodCatalogImages[slug];
  return catalog ? { ...catalog, isReference: true } : image;
}

export function galleryImagesForProduct<T extends { url: string; alt: string; isReference: boolean; sourceUrl: string | null }>(
  slug: string,
  images: T[],
): T[] {
  const catalog = woodCatalogImages[slug];
  if (!catalog || images.some((image) => image.url === catalog.url)) return images;
  return [{ ...catalog, isReference: true, sourceUrl: null } as T, ...images];
}
