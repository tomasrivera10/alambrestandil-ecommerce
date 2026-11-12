import studio from "@/content/catalog-studio.json";

/** Use corrected local assets only while the original studio reference is assigned. */
export function currentStudioImage<T extends { url: string; alt: string }>(slug: string, image: T): T {
  if (slug !== "palomita-j" && slug !== "palomita-z") return image;
  const asset = studio.assets[slug];
  return image.url === asset.url ? { ...image, url: asset.localUrl, alt: asset.alt } : image;
}
