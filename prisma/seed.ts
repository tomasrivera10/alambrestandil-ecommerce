import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Tejido romboidal",
    slug: "tejido-romboidal",
    description: "Tejido galvanizado para cercos perimetrales.",
    filterKeys: ["altura", "abertura", "calibre"],
  },
  {
    name: "Tejido revestido",
    slug: "tejido-revestido",
    description: "Tejido con revestimiento, línea ROMBOGREEN.",
    filterKeys: ["altura", "color"],
  },
  {
    name: "Tejido PVC",
    slug: "tejido-pvc",
    description: "Tejido plastificado para cierres más cerrados.",
    filterKeys: ["altura", "color"],
  },
  {
    name: "Malla electrosoldada",
    slug: "malla-electrosoldada",
    description: "Paneles y rollos de malla electrosoldada.",
    filterKeys: ["medida"],
  },
  {
    name: "Concertinas",
    slug: "concertinas",
    description: "Concertina para reforzar un cerco existente.",
    filterKeys: ["diametro"],
  },
  {
    name: "Alambre de púas",
    slug: "alambre-de-puas",
    description: "Púas para campo y perímetro.",
    filterKeys: ["presentacion"],
  },
  {
    name: "Postes de hormigón",
    slug: "postes-de-hormigon",
    description: "Postes olímpicos, rectos y placas.",
    filterKeys: ["tipo", "largo"],
  },
  {
    name: "Puertas y portones",
    slug: "puertas-y-portones",
    description: "Puertas, portones y tranqueras.",
    filterKeys: ["tipo", "ancho"],
  },
  {
    name: "Clavos",
    slug: "clavos",
    description: "Clavos para obra y colocación.",
    filterKeys: ["medida"],
  },
  {
    name: "Insumos de obra",
    slug: "insumos-de-obra",
    description: "Materiales de apoyo para la colocación.",
    filterKeys: ["tipo"],
  },
  {
    name: "Alambre galvanizado",
    slug: "alambre-galvanizado",
    description: "Tensores y alambre de atar.",
    filterKeys: ["calibre"],
  },
  {
    name: "Accesorios de colocación",
    slug: "accesorios-de-colocacion",
    description: "Torniquetes, ganchos y grampas.",
    filterKeys: ["tipo"],
  },
];

type SeedVariant = {
  sku: string;
  name: string;
  attributes: Record<string, string>;
  onHand: number;
  minStock: number;
  price?: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  technicalDescription: string;
  brand?: string;
  salesUnit: "UNIDAD" | "METRO" | "ROLLO" | "KG" | "PAQUETE" | "PANEL" | "JUEGO";
  priceVisibility: "PUBLIC" | "HIDDEN" | "FROM";
  price?: number;
  ctaType?: "ADD_TO_ORDER" | "REQUEST_QUOTE" | "CHECK_AVAILABILITY";
  featured?: boolean;
  uses: string[];
  variants: SeedVariant[];
};

const products: SeedProduct[] = [
  {
    name: "Tejido romboidal galvanizado",
    slug: "tejido-romboidal-galvanizado",
    category: "tejido-romboidal",
    shortDescription: "Tejido para cerrar lote, casa o campo. La altura y la abertura se eligen en la variante.",
    technicalDescription:
      "Tejido romboidal galvanizado. El rollo de referencia es de 10 m; el largo de obra se confirma en el local. Marca de referencia: Romboidal SA.",
    brand: "Romboidal",
    salesUnit: "ROLLO",
    priceVisibility: "FROM",
    price: 48000,
    featured: true,
    uses: ["terreno", "casa", "campo"],
    variants: [
      { sku: "TR-150-50", name: "1,50 m · abertura 5 cm", attributes: { altura: "1.50", abertura: "5 cm", calibre: "14" }, onHand: 12, minStock: 4 },
      { sku: "TR-180-50", name: "1,80 m · abertura 5 cm", attributes: { altura: "1.80", abertura: "5 cm", calibre: "14" }, onHand: 8, minStock: 3 },
      { sku: "TR-200-50", name: "2,00 m · abertura 5 cm", attributes: { altura: "2.00", abertura: "5 cm", calibre: "14" }, onHand: 2, minStock: 2 },
    ],
  },
  {
    name: "Tejido revestido ROMBOGREEN",
    slug: "tejido-revestido-rombogreen",
    category: "tejido-revestido",
    shortDescription: "Tejido revestido, más cerrado a la vista, para vivienda y pileta.",
    technicalDescription: "Revestimiento verde industrial. Confirmar altura y color antes de reservar.",
    salesUnit: "ROLLO",
    priceVisibility: "HIDDEN",
    featured: true,
    uses: ["casa", "pileta"],
    variants: [
      { sku: "RV-150-VD", name: "1,50 m verde", attributes: { altura: "1.50", color: "verde" }, onHand: 4, minStock: 2 },
    ],
  },
  {
    name: "Poste olímpico de hormigón",
    slug: "poste-olimpico",
    category: "postes-de-hormigon",
    shortDescription: "Poste para tejido perimetral. Se cuenta uno cada 2,50 m, más esquinas y portón.",
    technicalDescription: "Hormigón armado. El largo se elige según la altura del tejido y el empotramiento.",
    salesUnit: "UNIDAD",
    priceVisibility: "PUBLIC",
    price: 8900,
    featured: true,
    uses: ["terreno", "campo", "cancha"],
    variants: [
      { sku: "PO-240", name: "2,40 m", attributes: { tipo: "olimpico", largo: "2.40" }, onHand: 40, minStock: 10, price: 8900 },
      { sku: "PO-300", name: "3,00 m", attributes: { tipo: "olimpico", largo: "3.00" }, onHand: 6, minStock: 8, price: 12400 },
    ],
  },
  {
    name: "Portón de caño",
    slug: "porton-de-cano",
    category: "puertas-y-portones",
    shortDescription: "Portón para el acceso del cerco. Línea económica o reforzada.",
    technicalDescription: "Medidas de referencia. El vano real se mide en obra.",
    salesUnit: "UNIDAD",
    priceVisibility: "FROM",
    ctaType: "REQUEST_QUOTE",
    featured: true,
    uses: ["terreno", "casa"],
    variants: [
      { sku: "PT-300-ECO", name: "3,00 m económico", attributes: { tipo: "economico", ancho: "3.00" }, onHand: 1, minStock: 1 },
      { sku: "PT-300-REF", name: "3,00 m reforzado", attributes: { tipo: "reforzado", ancho: "3.00" }, onHand: 0, minStock: 1 },
    ],
  },
  {
    name: "Concertina",
    slug: "concertina",
    category: "concertinas",
    shortDescription: "Refuerzo de seguridad sobre un cerco ya colocado.",
    technicalDescription: "Se cotiza por rollo. La instalación depende del poste existente.",
    salesUnit: "ROLLO",
    priceVisibility: "HIDDEN",
    ctaType: "CHECK_AVAILABILITY",
    uses: ["seguridad"],
    variants: [{ sku: "CC-450", name: "Diámetro 45 cm", attributes: { diametro: "45 cm" }, onHand: 5, minStock: 2 }],
  },
  {
    name: "Alambre de púas",
    slug: "alambre-de-puas",
    category: "alambre-de-puas",
    shortDescription: "Púas para campo y refuerzo de perímetro.",
    technicalDescription: "Presentación en rollo. Confirmar metros por rollo al retirar.",
    salesUnit: "ROLLO",
    priceVisibility: "HIDDEN",
    uses: ["campo", "seguridad"],
    variants: [{ sku: "AP-ROLLO", name: "Rollo", attributes: { presentacion: "rollo" }, onHand: 15, minStock: 4 }],
  },
  {
    name: "Malla electrosoldada",
    slug: "malla-electrosoldada",
    category: "malla-electrosoldada",
    shortDescription: "Malla para losa, platea y cierres rígidos.",
    technicalDescription: "Medida del panel a confirmar según la obra.",
    salesUnit: "PANEL",
    priceVisibility: "HIDDEN",
    uses: ["obra"],
    variants: [{ sku: "ME-15", name: "Panel 15x15", attributes: { medida: "15x15" }, onHand: 20, minStock: 5 }],
  },
  {
    name: "Clavos de obra",
    slug: "clavos-de-obra",
    category: "clavos",
    shortDescription: "Clavos por kilo para colocación y obra.",
    technicalDescription: "Venta por kilo. La medida figura en la variante.",
    salesUnit: "KG",
    priceVisibility: "PUBLIC",
    price: 3200,
    uses: ["obra"],
    variants: [
      { sku: "CL-2", name: "2 pulgadas", attributes: { medida: "2" }, onHand: 30, minStock: 5, price: 3200 },
      { sku: "CL-3", name: "3 pulgadas", attributes: { medida: "3" }, onHand: 18, minStock: 5, price: 3400 },
    ],
  },
  {
    name: "Alambre tensor galvanizado",
    slug: "alambre-tensor",
    category: "alambre-galvanizado",
    shortDescription: "Tensor para tensar el tejido entre postes.",
    technicalDescription: "Rollo de referencia. La cantidad de hilos depende de la altura.",
    salesUnit: "ROLLO",
    priceVisibility: "FROM",
    price: 15000,
    uses: ["terreno", "campo"],
    variants: [{ sku: "AT-17", name: "Calibre 17", attributes: { calibre: "17" }, onHand: 10, minStock: 3 }],
  },
  {
    name: "Torniquetes y ganchos",
    slug: "torniquetes-y-ganchos",
    category: "accesorios-de-colocacion",
    shortDescription: "Juego de torniquetes y ganchos para tensar.",
    technicalDescription: "Se estima un juego por poste intermedio y de esquina.",
    salesUnit: "JUEGO",
    priceVisibility: "PUBLIC",
    price: 1800,
    uses: ["terreno"],
    variants: [{ sku: "TG-JUEGO", name: "Juego", attributes: { tipo: "torniquete" }, onHand: 50, minStock: 10, price: 1800 }],
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: { ...category, sortOrder: index },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const productIds = new Map<string, string>();
  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Categoría faltante: ${product.category}`);
    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        categoryId,
        shortDescription: product.shortDescription,
        technicalDescription: product.technicalDescription,
        brand: product.brand,
        salesUnit: product.salesUnit,
        priceVisibility: product.priceVisibility,
        price: product.price,
        ctaType: product.ctaType ?? "ADD_TO_ORDER",
        featured: product.featured ?? false,
        uses: product.uses,
        status: "ACTIVE",
      },
      create: {
        name: product.name,
        slug: product.slug,
        categoryId,
        shortDescription: product.shortDescription,
        technicalDescription: product.technicalDescription,
        brand: product.brand,
        salesUnit: product.salesUnit,
        priceVisibility: product.priceVisibility,
        price: product.price,
        ctaType: product.ctaType ?? "ADD_TO_ORDER",
        featured: product.featured ?? false,
        uses: product.uses,
        status: "ACTIVE",
      },
    });
    productIds.set(product.slug, saved.id);

    for (const variant of product.variants) {
      const existing = await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { name: variant.name, attributes: variant.attributes, price: variant.price, active: true },
        create: {
          productId: saved.id,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes,
          price: variant.price,
          active: true,
        },
      });
      await prisma.inventory.upsert({
        where: { variantId: existing.id },
        update: { minStock: variant.minStock },
        create: { variantId: existing.id, onHand: 0, reserved: 0, minStock: variant.minStock },
      });
      const moves = await prisma.stockMovement.count({ where: { variantId: existing.id } });
      if (moves === 0 && variant.onHand > 0) {
        await prisma.inventory.update({
          where: { variantId: existing.id },
          data: { onHand: variant.onHand },
        });
        await prisma.stockMovement.create({
          data: {
            variantId: existing.id,
            type: "ENTRADA",
            quantity: variant.onHand,
            onHandAfter: variant.onHand,
            reservedAfter: 0,
            reason: "Carga inicial",
          },
        });
      }
    }
  }

  const tejido = productIds.get("tejido-romboidal-galvanizado");
  const complements = ["poste-olimpico", "alambre-tensor", "torniquetes-y-ganchos", "porton-de-cano"];
  if (tejido) {
    for (const [index, slug] of complements.entries()) {
      const suggestedId = productIds.get(slug);
      if (!suggestedId) continue;
      await prisma.productComplement.upsert({
        where: { productId_suggestedId: { productId: tejido, suggestedId } },
        update: { sortOrder: index },
        create: { productId: tejido, suggestedId, sortOrder: index },
      });
    }
  }

  for (const name of ["Particular", "Constructor", "Alambrador", "Rural", "Empresa", "Mayorista", "Frecuente"]) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  await prisma.orderCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 1047 },
  });

  const settings: Record<string, string> = {
    whatsapp: process.env.WHATSAPP_NUMBER ?? "5492494214973",
    hours: "Lunes a viernes de 8 a 12 y de 15 a 19. Sábados de 8 a 12.",
    address: "Ijurco 1480, esquina colectora Macaya, Ruta 226, Tandil",
    estimateNotice:
      "Esta lista es una estimación para conversar. No reemplaza una medición ni un presupuesto cerrado.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@alambrestandil.local";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.warn("Sin SEED_ADMIN_PASSWORD: no se creó el usuario admin.");
  } else {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const id = randomUUID();
      await prisma.user.create({
        data: {
          id,
          name: "Administración",
          email,
          emailVerified: true,
          role: "ADMIN",
          accounts: {
            create: {
              id: randomUUID(),
              accountId: id,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
