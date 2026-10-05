import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/format";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: true, images: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl">{product.name}</h1>
      <div className="mt-6">
        <ProductForm
          categories={categories.map((item) => ({ id: item.id, name: item.name }))}
          product={{
            ...product,
            price: decimalToNumber(product.price),
          }}
        />
      </div>
      <h2 className="mt-10 font-heading text-xl">Variantes</h2>
      <ul className="mt-3 text-sm">
        {product.variants.map((variant) => (
          <li key={variant.id} className="border-b border-border py-2">
            {variant.name} · {variant.sku}
          </li>
        ))}
      </ul>
    </div>
  );
}
