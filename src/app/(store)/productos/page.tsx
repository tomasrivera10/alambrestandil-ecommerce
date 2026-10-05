import type { Metadata } from "next";
import { EmptyState } from "@/components/store/empty-state";
import { ProductCard } from "@/components/store/product-card";
import { listCategories, listProducts } from "@/features/products/queries";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Productos",
  description: "Catálogo de tejidos, postes, portones, concertinas y clavos en Tandil.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    listProducts({ sort: params.orden === "nombre" ? "name" : "featured" }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-heading text-4xl">Productos</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Tejidos, hormigón, portones y seguridad. Filtrá por categoría o buscá la medida.
      </p>
      <div className="mt-6 flex gap-2 overflow-auto pb-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/productos/${category.slug}`}
            className="shrink-0 border border-border px-3 py-2 text-sm hover:bg-card"
          >
            {category.name}
          </Link>
        ))}
      </div>
      {products.length === 0 ? (
        <EmptyState
          title="El catálogo está en carga"
          body="Cuando haya productos activos van a aparecer acá. Si necesitás algo ahora, escribinos."
        />
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
