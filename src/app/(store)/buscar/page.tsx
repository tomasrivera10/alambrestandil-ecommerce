import type { Metadata } from "next";
import { EmptyState } from "@/components/store/empty-state";
import { ProductCard } from "@/components/store/product-card";
import { listProducts } from "@/features/products/queries";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await listProducts({ q: query }) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-heading text-4xl">Buscar</h1>
      <form action="/buscar" className="mt-4">
        <input
          name="q"
          defaultValue={query}
          className="h-12 w-full max-w-xl border border-input bg-card px-3"
        />
      </form>
      {!query ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Probá “tejido 1.80”, “poste olímpico” o “cerco pileta”.
        </p>
      ) : products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No encontramos esa búsqueda"
            body="Revisá la medida o el nombre. Si no está en el catálogo, lo consultamos igual."
          />
        </div>
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
