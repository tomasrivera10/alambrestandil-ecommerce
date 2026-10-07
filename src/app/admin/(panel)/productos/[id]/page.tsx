import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/format";
import { VariantEditor } from "@/components/admin/variant-editor";
import { ImageEditor } from "@/components/admin/image-editor";
import { requireArea } from "@/lib/rbac";
import Link from "next/link";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("products");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { include: { inventory: true }, orderBy: { sku: "asc" } },
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  const { variants, images, category, ...formProduct } = product;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/productos" className="text-sm underline">
        Volver al catálogo
      </Link>
      <h1 className="font-heading text-3xl">{product.name}</h1>
      {product.status === "ACTIVE" && (
        <Link
          className="mt-2 inline-block text-sm underline"
          target="_blank"
          href={`/productos/${category.slug}/${product.slug}`}
        >
          Ver en la web
        </Link>
      )}
      <div className="mt-6">
        <ProductForm
          key={product.updatedAt.toISOString()}
          categories={categories.map((item) => ({ id: item.id, name: item.name }))}
          product={{
            ...formProduct,
            price: decimalToNumber(product.price),
          }}
        />
      </div>
      <ImageEditor productId={product.id} name={product.name} images={images} />
      <VariantEditor
        productId={product.id}
        variants={variants.map((v) => ({
          ...v,
          price: decimalToNumber(v.price),
          attributes: v.attributes as Record<string, string>,
        }))}
      />
    </div>
  );
}
