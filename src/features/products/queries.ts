import { prisma, safeQuery } from "@/lib/db";
import { decimalToNumber } from "@/lib/format";
import { rankSearchHit } from "@/features/search/rank";
import type { Prisma } from "@/generated/prisma/client";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  brand: string | null;
  salesUnit: string;
  priceVisibility: "PUBLIC" | "HIDDEN" | "FROM";
  price: number | null;
  featured: boolean;
  uses: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  available: number | null;
};

function mapProduct(product: {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  brand: string | null;
  salesUnit: string;
  priceVisibility: CatalogProduct["priceVisibility"];
  price: { toNumber(): number } | null;
  featured: boolean;
  uses: string[];
  category: { slug: string; name: string };
  images: { url: string; alt: string }[];
  variants: { inventory: { onHand: number; reserved: number } | null }[];
}): CatalogProduct {
  const available = product.variants.reduce((sum, variant) => {
    if (!variant.inventory) return sum;
    return sum + (variant.inventory.onHand - variant.inventory.reserved);
  }, 0);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    shortDescription: product.shortDescription,
    brand: product.brand,
    salesUnit: String(product.salesUnit),
    priceVisibility: product.priceVisibility,
    price: decimalToNumber(product.price),
    featured: product.featured,
    uses: product.uses,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.alt ?? null,
    available,
  };
}

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { include: { inventory: true } },
};

export async function listCategories() {
  return safeQuery(
    () =>
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
      }),
    [],
  );
}

export async function getCategory(slug: string) {
  return safeQuery(() => prisma.category.findUnique({ where: { slug } }), null);
}

export async function listProducts(filters?: {
  categorySlug?: string;
  featured?: boolean;
  q?: string;
  brand?: string;
  availableOnly?: boolean;
  attributes?: Record<string, string>;
  sort?: "name" | "featured";
}) {
  const products = await safeQuery(
    () =>
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          brand: filters?.brand ? { equals: filters.brand, mode: "insensitive" } : undefined,
          variants: variantFilter(filters?.attributes, filters?.availableOnly),
          featured: filters?.featured ? true : undefined,
          category: filters?.categorySlug ? { slug: filters.categorySlug } : undefined,
        },
        include: {
          ...productInclude,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: {
            where: { active: true },
            include: { inventory: true },
          },
        },
        orderBy:
          filters?.sort === "name" ? { name: "asc" } : [{ featured: "desc" }, { name: "asc" }],
      }),
    [],
  );

  let mapped = products.map((product) => mapProduct(product as never));

  if (filters?.q) {
    const scored = products
      .map((product) => {
        const attributes = product.variants
          .map((variant) => JSON.stringify(variant.attributes))
          .join(" ");
        return {
          product: mapProduct(product as never),
          score: rankSearchHit(filters.q ?? "", {
            name: product.name,
            sku: product.sku,
            category: product.category.name,
            attributes,
            description: `${product.shortDescription} ${product.technicalDescription}`,
          }),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    mapped = scored.map((item) => item.product);
  }

  if (filters?.attributes && Object.keys(filters.attributes).length > 0) {
    const wanted = filters.attributes;
    const allowed = new Set(
      products
        .filter((product) =>
          product.variants.some((variant) => {
            const attrs = variant.attributes as Record<string, string>;
            return Object.entries(wanted).every(([key, value]) => !value || attrs[key] === value);
          }),
        )
        .map((product) => product.id),
    );
    mapped = mapped.filter((product) => allowed.has(product.id));
  }

  return mapped;
}

export async function getProductBySlug(categorySlug: string, slug: string) {
  return safeQuery(async () => {
    const product = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE", category: { slug: categorySlug } },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { active: true },
          include: { inventory: true },
          orderBy: { name: "asc" },
        },
        complements: {
          where: { suggested: { status: "ACTIVE" } },
          orderBy: { sortOrder: "asc" },
          include: {
            suggested: {
              include: {
                category: true,
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                variants: { where: { active: true }, include: { inventory: true } },
              },
            },
          },
        },
      },
    });
    if (!product) return null;
    return {
      ...product,
      price: decimalToNumber(product.price),
      variants: product.variants.map((variant) => ({
        ...variant,
        price: decimalToNumber(variant.price),
        available: variant.inventory ? variant.inventory.onHand - variant.inventory.reserved : 0,
        attributes: variant.attributes as Record<string, string>,
      })),
      complements: product.complements.map((item) => mapProduct(item.suggested as never)),
    };
  }, null);
}

export async function filterOptions(categorySlug: string, keys: string[]) {
  const variants = await safeQuery(
    () =>
      prisma.productVariant.findMany({
        where: { active: true, product: { status: "ACTIVE", category: { slug: categorySlug } } },
        select: { attributes: true },
      }),
    [],
  );
  const options: Record<string, string[]> = {};
  for (const key of keys) {
    const values = new Set<string>();
    for (const variant of variants) {
      const attrs = variant.attributes as Record<string, string>;
      if (attrs[key]) values.add(attrs[key]);
    }
    options[key] = [...values].sort((a, b) => a.localeCompare(b, "es"));
  }
  return options;
}

function variantFilter(
  attributes?: Record<string, string>,
  availableOnly?: boolean,
): Prisma.ProductVariantListRelationFilter | undefined {
  const entries = Object.entries(attributes ?? {}).filter(([, value]) => value);
  if (!entries.length && !availableOnly) return undefined;
  return {
    some: {
      active: true,
      AND: entries.map(([key, value]) => ({ attributes: { path: [key], equals: value } })),
      inventory: availableOnly
        ? { is: { onHand: { gt: prisma.inventory.fields.reserved } } }
        : undefined,
    },
  };
}

export type CatalogFilters = {
  categorySlug?: string;
  brand?: string;
  availableOnly?: boolean;
  q?: string;
  attributes?: Record<string, string>;
  sort?: "name" | "featured";
  page?: number;
};

export async function getCatalog(filters: CatalogFilters) {
  const pageSize = 12;
  try {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      category: filters.categorySlug ? { slug: filters.categorySlug } : undefined,
      brand: filters.brand ? { equals: filters.brand, mode: "insensitive" } : undefined,
      variants: variantFilter(filters.attributes, filters.availableOnly),
    };
    // Search keeps the existing attribute-aware ranking. Other catalog views paginate in SQL.
    if (filters.q?.trim()) {
      const matches = await prisma.product.findMany({
        where,
        include: {
          ...productInclude,
          variants: { where: { active: true }, include: { inventory: true } },
        },
      });
      const ranked = matches
        .map((product) => ({
          product,
          score: rankSearchHit(filters.q!, {
            name: product.name,
            sku: product.sku,
            category: product.category.name,
            attributes: product.variants.map((v) => JSON.stringify(v.attributes)).join(" "),
            description: `${product.shortDescription} ${product.technicalDescription}`,
          }),
        }))
        .filter((hit) => hit.score > 0);
      ranked.sort(
        filters.sort === "name"
          ? (a, b) => a.product.name.localeCompare(b.product.name, "es")
          : (a, b) => b.score - a.score,
      );
      const pages = Math.max(1, Math.ceil(ranked.length / pageSize));
      const page = Math.min(Math.max(1, filters.page ?? 1), pages);
      return {
        products: ranked
          .slice((page - 1) * pageSize, page * pageSize)
          .map((hit) => mapProduct(hit.product)),
        total: ranked.length,
        page,
        pages,
        unavailable: false,
      };
    }
    const total = await prisma.product.count({ where });
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, filters.page ?? 1), pages);
    const products = await prisma.product.findMany({
      where,
      include: {
        ...productInclude,
        variants: { where: { active: true }, include: { inventory: true } },
      },
      orderBy: filters.sort === "name" ? { name: "asc" } : [{ featured: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { products: products.map(mapProduct), total, page, pages, unavailable: false };
  } catch (error) {
    console.error("Catalog query failed", error);
    return { products: [], total: 0, page: 1, pages: 1, unavailable: true };
  }
}

export async function listBrands(categorySlug?: string) {
  const products = await safeQuery(
    () =>
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          brand: { not: null },
          category: categorySlug ? { slug: categorySlug } : undefined,
        },
        select: { brand: true },
        distinct: ["brand"],
        orderBy: { brand: "asc" },
      }),
    [],
  );
  return products.map((product) => product.brand!).filter(Boolean);
}
