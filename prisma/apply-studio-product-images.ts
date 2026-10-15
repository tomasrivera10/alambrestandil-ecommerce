import type { PrismaClient } from "../src/generated/prisma/client";
import manifest from "../src/content/catalog-studio.json";

type AssetKey = keyof typeof manifest.assets;
type ProductSlug = keyof typeof manifest.products;

/** Replace reviewed reference assets once; preserve own photos, uploads and later admin edits. */
export async function applyStudioProductImages(prisma: PrismaClient) {
  const key = manifest.version;
  const saved = await prisma.siteSetting.findUnique({ where: { key } });
  const previous = saved
    ? (JSON.parse(saved.value) as {
        backup: { productId: string; slug: string; images: unknown[] }[];
      })
    : { backup: [] };
  const applied = new Set(previous.backup.map((product) => product.slug));
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, slug: true, images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });
  const pending = products.filter((product) => !applied.has(product.slug));
  if (!pending.length) return { applied: false, products: 0 };
  const missing = pending.filter((product) => !(product.slug in manifest.products));
  if (missing.length)
    throw new Error(`Faltan imágenes de estudio: ${missing.map((p) => p.slug).join(", ")}`);
  for (const product of pending) {
    for (const name of manifest.products[product.slug as ProductSlug]) {
      const asset = manifest.assets[name as AssetKey];
      if (!asset?.url.startsWith("https:"))
        throw new Error(`Publicá y verificá la imagen antes de asignarla: ${name}`);
    }
  }
  return prisma.$transaction(
    async (tx) => {
      // Capture current gallery data inside the same transaction as the replacement.
      const marker = await tx.siteSetting.findUnique({ where: { key } });
      const prior = marker ? (JSON.parse(marker.value) as typeof previous) : { backup: [] };
      const done = new Set(prior.backup.map((product) => product.slug));
      const current = await tx.product.findMany({
        where: {
          id: {
            in: pending.filter((product) => !done.has(product.slug)).map((product) => product.id),
          },
          status: "ACTIVE",
        },
        select: {
          id: true,
          slug: true,
          images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      });
      if (!current.length) return { applied: false, products: 0 };
      const backup = [
        ...prior.backup,
        ...current.map((p) => ({ productId: p.id, slug: p.slug, images: p.images })),
      ];
      for (const product of current) {
        const names = manifest.products[product.slug as ProductSlug];
        const legacy = product.images.filter(
          (image) =>
            image.isReference &&
            [
              "/images/catalogo/",
              "/images/referencias-productos/",
              "/images/romboidal/",
              "/images/productos-generados/",
              "/images/productos-transparentes/",
            ].some((prefix) => image.url.startsWith(prefix)),
        );
        await tx.productImage.deleteMany({
          where: { id: { in: legacy.map((image) => image.id) } },
        });
        await tx.productImage.updateMany({
          where: { productId: product.id },
          data: { sortOrder: { increment: names.length } },
        });
        for (const [sortOrder, name] of names.entries()) {
          const asset = manifest.assets[name as AssetKey];
          await tx.productImage.create({
            data: {
              productId: product.id,
              url: asset.url,
              alt: asset.alt,
              sourceUrl: asset.sourceUrl,
              sortOrder,
              isReference: true,
            },
          });
        }
      }
      const value = JSON.stringify({ appliedAt: new Date().toISOString(), backup });
      await tx.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      return { applied: true, products: current.length };
    },
    { isolationLevel: "Serializable", maxWait: 10000, timeout: 120000 },
  );
}
