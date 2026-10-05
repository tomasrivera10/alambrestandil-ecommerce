import type { MetadataRoute } from "next";
import { solutions } from "@/content/solutions";
import { prisma, safeQuery } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const products = await safeQuery(
    () =>
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
      }),
    [],
  );
  const categories = await safeQuery(
    () => prisma.category.findMany({ select: { slug: true } }),
    [],
  );

  return [
    "",
    "/productos",
    "/soluciones",
    "/calcular-alambrado",
    "/instalaciones",
    "/nosotros",
    "/contacto",
    "/pedido",
    ...solutions.map((item) => `/soluciones/${item.slug}`),
    ...categories.map((item) => `/productos/${item.slug}`),
    ...products.map((item) => `/productos/${item.category.slug}/${item.slug}`),
  ].map((path) => ({ url: `${base}${path}` }));
}
