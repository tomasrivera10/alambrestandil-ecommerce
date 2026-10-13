import { unstable_cache, updateTag } from "next/cache";

export const CATALOG_TAG = "public-catalog-v1";

// Cache successful public reads only. A database outage must never turn into
// a cached empty catalog; fallbacks are returned outside the cache boundary.
export function cachedCatalogRead<Args extends unknown[], Result>(
  read: (...args: Args) => Promise<Result>,
  key: string,
  revalidate: number,
  fallback: Result,
): (...args: Args) => Promise<Result> {
  const cached = unstable_cache(read, [CATALOG_TAG, key], {
    tags: [CATALOG_TAG],
    revalidate,
  });
  return async (...args: Args) => {
    try {
      return await cached(...args);
    } catch (error) {
      console.error(`Catalog read failed: ${key}`, error);
      return fallback;
    }
  };
}

// Call after a successful Server Action commit so the next read is fresh.
export function invalidateCatalog() {
  updateTag(CATALOG_TAG);
}
