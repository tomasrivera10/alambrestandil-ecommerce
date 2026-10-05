import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl">Nuevo producto</h1>
      <div className="mt-6">
        <ProductForm categories={categories.map((item) => ({ id: item.id, name: item.name }))} />
      </div>
    </div>
  );
}
