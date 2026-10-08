import type { PrismaClient } from "../src/generated/prisma/client";

const images = [
  {
    slug: "tejido-romboidal-galvanizado",
    url: "/images/referencias-productos/tejido-galvanizado.jpeg",
    alt: "Rollo de tejido romboidal galvanizado parcialmente desplegado; imagen de referencia.",
    sourceUrl:
      "https://www.catumbitelas.com.br/casa-e-jardim/alambrado-galvanizado-malha-3-fio-2-75-mm-altura-2m-preco-por-metro",
  },
  {
    slug: "torniquete-zincado",
    url: "/images/referencias-productos/torniquete-cambren.webp",
    alt: "Torniquete zincado Nº 7; imagen de referencia, la presentación varía según la medida.",
    sourceUrl:
      "https://www.tiendacambren.com.ar/productos/torniquetes-n-7-para-estirar-alambre-golondrina-17-15/",
  },
  {
    slug: "alambre-de-puas",
    url: "/images/romboidal/puas.webp",
    alt: "Rollos de alambre de púas Cactus publicados por Romboidal; imagen de referencia.",
    sourceUrl: "https://www.romboidal.com.ar/",
  },
  {
    slug: "concertina-de-seguridad",
    url: "/images/romboidal/concertinas.webp",
    alt: "Rollos de concertina de seguridad publicados por Romboidal; imagen de referencia.",
    sourceUrl: "https://www.romboidal.com.ar/",
  },
  {
    slug: "porton-para-cerco",
    url: "/images/romboidal/puertas.webp",
    alt: "Portón de dos hojas con tejido romboidal; imagen de referencia de Romboidal.",
    sourceUrl: "https://www.romboidal.com.ar/",
  },
];

export async function applyProductImages(prisma: PrismaClient) {
  const key = "product-images-2026-10-08";
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await prisma.$transaction(async (tx) => {
    for (const image of images) {
      const product = await tx.product.findUnique({ where: { slug: image.slug } });
      if (!product || product.status !== "ACTIVE") {
        throw new Error(`No se encontró el producto activo ${image.slug}`);
      }
      // Keep previous photographs and all custom uploads in the gallery.
      await tx.productImage.updateMany({
        where: { productId: product.id },
        data: { sortOrder: { increment: 1 } },
      });
      await tx.productImage.create({
        data: {
          url: image.url,
          alt: image.alt,
          sourceUrl: image.sourceUrl,
          productId: product.id,
          sortOrder: 0,
          isReference: true,
        },
      });
    }
    await tx.siteSetting.create({ data: { key, value: "5 fotografías de referencia asignadas" } });
  });
}

export async function applyPostImages(prisma: PrismaClient) {
  const key = "post-images-generated-2026-10-08";
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await prisma.$transaction(async (tx) => {
    for (const slug of ["poste-esquinero", "poste-intermedio"]) {
      const product = await tx.product.findUniqueOrThrow({ where: { slug } });
      if (product.status !== "ACTIVE") throw new Error(`Producto inactivo: ${slug}`);
      await tx.productImage.updateMany({
        where: { productId: product.id },
        data: { sortOrder: { increment: 2 } },
      });
      for (const [sortOrder, type] of ["recto", "olimpico"].entries()) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: `/images/productos-transparentes/postes/poste-${type}.png`,
            alt: `Poste de hormigón ${type === "recto" ? "recto" : "olímpico"}: visualización orientativa regenerada con IA a partir de referencias de Romboidal; detalles y medidas pueden variar.`,
            sourceUrl: "https://www.romboidal.com.ar/#presupuesto",
            isReference: true,
            sortOrder,
          },
        });
      }
    }
    await tx.siteSetting.create({
      data: { key, value: "Poste recto y olímpico en las dos familias de postes" },
    });
  });
}

export async function applyFeaturedImages(prisma: PrismaClient) {
  const key = "featured-images-generated-2026-10-08-v1";
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await prisma.$transaction(async (tx) => {
    for (const [slug, file, subject] of [
      ["alambre-de-puas", "alambre-puas", "Rollo de alambre de púas galvanizado"],
      ["clavo-punta-paris", "clavos-paris", "Clavos punta París de acero"],
    ]) {
      const product = await tx.product.findUniqueOrThrow({ where: { slug } });
      if (product.status !== "ACTIVE") throw new Error(`Producto inactivo: ${slug}`);
      await tx.productImage.updateMany({ where: { productId: product.id }, data: { sortOrder: { increment: 1 } } });
      await tx.productImage.create({ data: {
        productId: product.id,
        url: `/images/productos-generados/${file}.webp`,
        alt: `${subject}. Visualización orientativa generada con IA; marca, medida y presentación pueden variar.`,
        isReference: true,
        sortOrder: 0,
      } });
    }
    await tx.siteSetting.create({ data: { key, value: "Púas y clavos sobre blanco para destacados" } });
  });
}

export async function applyInstalledDoorImage(prisma: PrismaClient) {
  const key = "installed-door-photo-2026-10-08-v1";
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { slug: "puerta-para-cerco" } });
    await tx.productImage.updateMany({
      where: { productId: product.id, sortOrder: { gte: 1 } },
      data: { sortOrder: { increment: 1 } },
    });
    await tx.productImage.create({
      data: {
        productId: product.id,
        url: "/images/productos-reales/puerta-cerco-instalada.png",
        alt: "Puerta de caño galvanizado y tejido romboidal instalada entre postes de hormigón. Fotografía aportada por Alambres Tandil; medida no identificada.",
        isReference: false,
        sortOrder: 1,
      },
    });
    await tx.siteSetting.create({ data: { key, value: "Foto real de puerta instalada como segunda imagen" } });
  });
}

/** Catalog visualizations; keep original photographs available in the gallery. */
export async function applyGateImages(prisma: PrismaClient) {
  const key = "gate-images-generated-2026-10-08-v1";
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await prisma.$transaction(async (tx) => {
    for (const [slug, file, subject] of [
      ["porton-para-cerco", "porton-dos-hojas", "Portón galvanizado de dos hojas"],
      ["puerta-para-cerco", "puerta-peatonal", "Puerta peatonal galvanizada"],
    ]) {
      const product = await tx.product.findUniqueOrThrow({ where: { slug } });
      if (product.status !== "ACTIVE") throw new Error(`Producto inactivo: ${slug}`);
      await tx.productImage.updateMany({
        where: { productId: product.id },
        data: { sortOrder: { increment: 1 } },
      });
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: `/images/productos-transparentes/portones/${file}.webp`,
          alt: `${subject} con tejido romboidal. Visualización orientativa generada con IA a partir de una foto de Alambres Tandil; detalles y proporciones pueden variar.`,
          isReference: true,
          sortOrder: 0,
        },
      });
    }
    await tx.siteSetting.create({ data: { key, value: "Portón y puerta: visualizaciones sobre blanco" } });
  });
}
