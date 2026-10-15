import "dotenv/config";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import manifest from "../src/content/catalog-studio.json";
import { variantImageIndex } from "../src/features/products/variant-image";

async function main() {
  for (const [key, asset] of Object.entries(manifest.assets)) {
    const file = await readFile(`public${asset.localUrl}`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, "webp", key);
    assert.equal(metadata.hasAlpha, false, `${key}: fondo opaco`);
    assert.equal(metadata.width, asset.width, `${key}: sin ampliación artificial`);
    assert.equal(metadata.height, asset.height, key);
    assert(Math.max(metadata.width!, metadata.height!) >= 1200, `${key}: resolución`);
    assert.equal(createHash("sha256").update(file).digest("hex"), asset.sha256, key);
    assert(asset.url.startsWith("https://"), `${key}: imagen publicada`);
  }
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        category: { select: { slug: true } },
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        variants: { where: { active: true } },
      },
    });
    let references = 0;
    for (const product of products) {
      const names = manifest.products[product.slug as keyof typeof manifest.products];
      assert(names?.length, `Familia sin asignación: ${product.slug}`);
      for (const [index, name] of names.entries()) {
        const asset = manifest.assets[name as keyof typeof manifest.assets];
        assert.equal(product.images[index]?.url, asset.url, `${product.slug}: imagen ${index}`);
        assert.equal(product.images[index]?.isReference, true, product.slug);
        references++;
      }
      for (const variant of product.variants) {
        const index = variantImageIndex(product.images, {
          ...variant,
          attributes: variant.attributes as Record<string, string>,
        });
        assert(product.images[index]?.url, `${variant.sku}: sin imagen`);
        if (/ol[ií]mpico/i.test(variant.name))
          assert(product.images[index].alt.includes("olímpico"), variant.sku);
        if (variant.sku === "AT-XLS-033")
          assert.equal(product.images[index].url, manifest.assets["concertina-simple"].url);
        if (variant.sku === "AT-XLS-034")
          assert.equal(product.images[index].url, manifest.assets["concertina-cruzada"].url);
      }
    }
    const marker = await prisma.siteSetting.findUniqueOrThrow({ where: { key: manifest.version } });
    const backup = JSON.parse(marker.value).backup as {
      productId: string;
      images: { id: string; url: string; isReference: boolean }[];
    }[];
    for (const old of backup) {
      const current = products.find((product) => product.id === old.productId);
      if (!current) continue;
      for (const photo of old.images.filter((image) => !image.isReference)) {
        assert(
          current.images.some((image) => image.id === photo.id && image.url === photo.url),
          "Se debe conservar la fotografía real",
        );
      }
    }
    console.log(
      JSON.stringify({
        assets: Object.keys(manifest.assets).length,
        activeFamilies: products.length,
        assignedReferences: references,
        missingImages: products.filter((product) => !product.images.length).length,
        variantsWithImages: products.reduce((n, p) => n + p.variants.length, 0),
        ownPhotosPreserved: true,
      }),
    );
    if (process.env.CATALOG_UPLOAD_SESSION) {
      const { origin, cookie } = JSON.parse(
        await readFile(process.env.CATALOG_UPLOAD_SESSION, "utf8"),
      );
      const selected = ["torniquete-doble", "palomita-j", "concertina-de-seguridad", "puntal"].map(
        (slug) => products.find((p) => p.slug === slug)!,
      );
      for (const product of selected) {
        for (const route of [
          `/productos/${product.category.slug}/${product.slug}`,
          `/admin/productos/${product.id}`,
        ]) {
          const result = await fetch(origin + route, {
            headers: { Cookie: cookie },
            redirect: "error",
          });
          assert.equal(result.status, 200, route);
          const html = await result.text();
          assert(html.includes(product.images[0].url), `${route}: imagen publicada ausente`);
        }
      }
      console.log(
        "HTTP: 4 fichas públicas y 4 fichas de administración muestran las nuevas imágenes.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
