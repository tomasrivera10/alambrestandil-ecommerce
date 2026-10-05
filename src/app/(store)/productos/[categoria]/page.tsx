import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/store/empty-state";
import { ProductCard } from "@/components/store/product-card";
import { filterOptions, getCategory, listProducts } from "@/features/products/queries";

type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategory(categoria);
  return {
    title: category?.name ?? "Categoría",
    description: category?.description ?? "Productos de Alambres Tandil.",
  };
}

const LABELS: Record<string, string> = {
  altura: "Altura",
  abertura: "Abertura",
  calibre: "Calibre",
  revestimiento: "Revestimiento",
  largo: "Largo",
  terminacion: "Terminación",
  seccion: "Sección",
  tipo: "Tipo",
  uso: "Uso",
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const query = await searchParams;
  const category = await getCategory(categoria);
  if (!category) notFound();
  const attributes = Object.fromEntries(
    category.filterKeys
      .filter((key) => query[key])
      .map((key) => [key, query[key] as string]),
  );
  const [products, options] = await Promise.all([
    listProducts({ categorySlug: categoria, attributes }),
    filterOptions(categoria, category.filterKeys),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm text-muted-foreground">
        <Link href="/productos">Productos</Link> / {category.name}
      </p>
      <h1 className="mt-2 font-heading text-4xl">{category.name}</h1>
      {category.description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed">{category.description}</p>
      ) : null}
      {category.filterKeys.length > 0 ? (
        <form className="mt-6 flex flex-wrap gap-3">
          {category.filterKeys.map((key) => (
            <label key={key} className="grid gap-1 text-xs">
              {LABELS[key] ?? key}
              <select
                name={key}
                defaultValue={query[key] ?? ""}
                className="h-10 min-w-32 border border-input bg-card px-2 text-sm"
              >
                <option value="">Todas</option>
                {(options[key] ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="self-end h-10 border border-foreground px-4 text-sm" type="submit">
            Filtrar
          </button>
        </form>
      ) : null}
      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Sin resultados en esta categoría"
            body="Probá otra medida o escribinos la que necesitás. Muchas veces se consigue a pedido."
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
