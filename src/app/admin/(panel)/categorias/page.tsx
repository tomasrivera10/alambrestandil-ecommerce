import { prisma, safeQuery } from "@/lib/db";

export default async function CategoriesPage() {
  const categories = await safeQuery(
    () => prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    [],
  );
  return (
    <div>
      <h1 className="font-heading text-3xl">Categorías</h1>
      <ul className="mt-4 text-sm">
        {categories.map((category) => (
          <li key={category.id} className="border-b border-border py-2">
            {category.name} · {category.slug} · {category._count.products} productos
            <span className="block text-muted-foreground">Filtros: {category.filterKeys.join(", ") || "ninguno"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
