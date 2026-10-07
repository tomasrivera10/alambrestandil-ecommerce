import catalog from "./catalog.json";
import type { PrismaClient, SalesUnit } from "../src/generated/prisma/client";

const categoryNames: Record<string, string> = {
  "tejido-romboidal": "Tejido romboidal",
  "accesorios-de-colocacion": "Accesorios de colocación",
  "alambre-galvanizado": "Alambres lisos",
  concertinas: "Seguridad y concertinas",
  "alambre-de-puas": "Alambre de púas",
  clavos: "Clavos",
  "puertas-y-portones": "Puertas y portones",
  "postes-de-hormigon": "Postes y puntales",
};

// Reference photographs are never evidence of the stocked brand or exact size.
export const catalogImages: Record<string, { file: string; page: string }> = {
  "tejido-romboidal-galvanizado": { file: "tejido-romboidal", page: "41-tejido-romboidal" },
  "torniquete-zincado": { file: "torniquetes", page: "52-torniquetes" },
  "planchuela-zincada": { file: "planchuelas", page: "51-planchuelas-diferentes-alturas" },
  "alambre-alta-resistencia": {
    file: "alambre-ar",
    page: "67-alambre-de-alta-y-mediana-resistencia",
  },
  "alambre-de-puas": { file: "puas", page: "64-alambre-de-pas" },
  "poste-esquinero": { file: "postes", page: "71-postes-de-hormign-rectos-y-olmpicos" },
  "poste-intermedio": { file: "postes", page: "71-postes-de-hormign-rectos-y-olmpicos" },
  "gancho-j": { file: "ganchos", page: "53-ganchos-jota-diferentes-tamaos" },
  "concertina-de-seguridad": { file: "concertina-cruzada", page: "63-concertinas-dobles" },
};

export async function importCatalog(prisma: PrismaClient) {
  const key = "catalog-import-stock-2026-10-07";
  if (await prisma.siteSetting.findUnique({ where: { key } })) {
    console.log("Catálogo ya importado. Se conservan las ediciones del panel.");
    return;
  }
  await prisma.$transaction(
    async (tx) => {
      // Retire only known demonstration products. Preserve all orders and inventory history.
      const demoSlugs = [
        "tejido-revestido-rombogreen",
        "poste-olimpico",
        "porton-de-cano",
        "concertina",
        "malla-electrosoldada",
        "clavos-de-obra",
        "alambre-tensor",
        "torniquetes-y-ganchos",
      ];
      await tx.product.updateMany({
        where: { slug: { in: demoSlugs } },
        data: { status: "ARCHIVED", featured: false },
      });
      await tx.productVariant.updateMany({
        where: {
          OR: [
            { product: { slug: { in: demoSlugs } } },
            { sku: { in: ["TR-150-50", "TR-180-50", "TR-200-50", "AP-ROLLO"] } },
          ],
        },
        data: { active: false },
      });
      for (const [index, [slug, name]] of Object.entries(categoryNames).entries()) {
        await tx.category.upsert({
          where: { slug },
          update: { name, sortOrder: index },
          create: {
            name,
            slug,
            sortOrder: index,
            filterKeys: [
              "medida",
              "altura",
              "largo",
              "calibre",
              "abertura",
              "diametro",
              "tipo",
              "presentacion",
              "seccion",
            ],
          },
        });
      }
      for (const item of catalog.products) {
        const category = await tx.category.findUniqueOrThrow({ where: { slug: item.category } });
        const data = {
          name: item.name,
          categoryId: category.id,
          brand: item.brand,
          salesUnit: item.salesUnit as SalesUnit,
          shortDescription: item.shortDescription,
          technicalDescription: item.technicalDescription,
          price: null,
          priceVisibility: "HIDDEN" as const,
          status: "ACTIVE" as const,
          featured: item.featured,
          uses: [],
          ctaType: "ADD_TO_ORDER" as const,
        };
        const product = await tx.product.upsert({
          where: { slug: item.slug },
          update: data,
          create: { ...data, slug: item.slug },
        });
        for (const variant of item.variants) {
          const data = {
            ...variant,
            productId: product.id,
            salesUnit: variant.salesUnit as SalesUnit,
            price: null,
          };
          const saved = await tx.productVariant.upsert({
            where: { sku: variant.sku },
            update: data,
            create: data,
          });
          // Zero is an uninitialized balance; never copy old spreadsheet counts.
          await tx.inventory.upsert({
            where: { variantId: saved.id },
            update: {},
            create: { variantId: saved.id },
          });
        }
        const photo = catalogImages[item.slug];
        if (photo) {
          await tx.productImage.create({
            data: {
              productId: product.id,
              url: `/images/catalogo/${photo.file}.jpg`,
              alt: `${item.name}: fotografía de referencia de Alambre Pallás; la medida y terminación se confirman con el local.`,
              sourceUrl: `https://www.alambre.com.ar/aberturas-de-aluminio/${photo.page}`,
              isReference: true,
            },
          });
        }
      }
      await tx.siteSetting.create({
        data: { key, value: "31 familias; 94 referencias únicas; precios y stock excluidos" },
      });
    },
    { timeout: 60000 },
  );
  console.log(
    "Importadas 31 familias y 94 referencias únicas. Precios y stock del Excel excluidos.",
  );
}
