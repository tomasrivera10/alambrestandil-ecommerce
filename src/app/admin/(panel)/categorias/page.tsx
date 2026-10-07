import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
import { CategoryEditor } from "@/components/admin/category-editor";

export default async function CategoriesPage() {
  await requireArea("products");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <div className="max-w-5xl">
      <h1 className="font-heading text-3xl">Categorías</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Organizá el catálogo y elegí qué atributos se pueden filtrar. Las categorías vacías no se
        muestran en la tienda.
      </p>
      <div className="mt-6 divide-y divide-border border-y border-border text-sm">
        {categories.map((category) => (
          <details key={category.id}>
            <summary className="cursor-pointer py-4">
              {category.name} · {category._count.products} productos
            </summary>
            <CategoryEditor category={category} />
          </details>
        ))}
      </div>
      <details className="mt-8">
        <summary className="cursor-pointer font-medium">Agregar categoría</summary>
        <CategoryEditor />
      </details>
    </div>
  );
}
