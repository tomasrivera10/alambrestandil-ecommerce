import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import {
  getCatalog,
  listBrands,
  listCategories,
  filterOptions,
  type CatalogFilters,
} from "@/features/products/queries";
import { CatalogFilters as Filters, ActiveFilters, SortCatalog } from "./catalog-filters";
import { ProductCard } from "./product-card";
import { site } from "@/content/site";

type Category = { name: string; slug: string; description: string | null; filterKeys: string[] };
export async function CatalogView({
  query: raw,
  category,
  search = false,
}: {
  query: Record<string, string | string[] | undefined>;
  category?: Category;
  search?: boolean;
}) {
  const query = Object.fromEntries(
    Object.entries(raw)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, String(value)]),
  );
  const attributes = Object.fromEntries(
    (category?.filterKeys ?? []).filter((key) => query[key]).map((key) => [key, query[key]]),
  );
  const pageNumber = Number(query.pagina);
  const filters: CatalogFilters = {
    categorySlug: category?.slug,
    q: query.q?.trim(),
    brand: query.marca,
    availableOnly: query.disponible === "1",
    attributes,
    sort: query.orden === "nombre" ? "name" : "featured",
    page: Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
  };
  const [result, categories, brands, options] = await Promise.all([
    getCatalog(filters),
    listCategories(),
    listBrands(category?.slug),
    category ? filterOptions(category.slug, category.filterKeys) : Promise.resolve({}),
  ]);
  const basePath = search ? "/buscar" : category ? `/productos/${category.slug}` : "/productos";
  const title = search
    ? query.q
      ? `Resultados para “${query.q}”`
      : "Encontrá tu material."
    : (category?.name ?? "Materiales para hacerlo bien.");
  const pageHref = (page: number) => {
    const params = new URLSearchParams(query);
    params.set("pagina", String(page));
    return `${basePath}?${params}`;
  };
  return (
    <div className="catalog-page store-container">
      <div className="store-breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        {category ? (
          <>
            <Link href="/productos">Productos</Link>
            <span>/</span>
            <span>{category.name}</span>
          </>
        ) : (
          <span>{search ? "Buscar" : "Productos"}</span>
        )}
      </div>
      <div className="catalog-heading">
        <h1>{title}</h1>
        <p>
          {category?.description ??
            "Elegí el producto, encontrá tu medida y armá el pedido. Los detalles los cerramos por WhatsApp."}
        </p>
      </div>
      <div className="catalog-layout">
        <Filters
          key={`${basePath}:${JSON.stringify(query)}`}
          basePath={basePath}
          categories={categories}
          currentCategory={category?.slug}
          brands={brands}
          options={options}
          query={query}
          total={result.total}
        />
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <span role="status" aria-live="polite">
              {result.unavailable
                ? "Catálogo temporalmente no disponible"
                : `${result.total} ${result.total === 1 ? "producto" : "productos"}`}
            </span>
            <SortCatalog query={query} basePath={basePath} />
          </div>
          <ActiveFilters
            query={query}
            basePath={basePath}
            allowedKeys={["q", "marca", "disponible", ...Object.keys(options)]}
          />
          {result.products.length ? (
            <div className="catalog-product-grid">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <h2>
                {result.unavailable
                  ? "Estamos actualizando el catálogo."
                  : "No encontramos esa combinación."}
              </h2>
              <p>
                {result.unavailable
                  ? "Intentá nuevamente en unos minutos o consultanos directamente por el material que necesitás."
                  : "Probá con otra medida o quitá algún filtro. También podemos ayudarte a encontrar el material."}
              </p>
              <div>
                <Link href={basePath} className="store-button button-outline">
                  {result.unavailable ? "Volver a intentar" : "Limpiar filtros"}
                </Link>
                <a href={site.whatsappLink} className="text-link">
                  <MessageCircle size={17} />
                  Consultanos
                </a>
              </div>
            </div>
          )}
          {result.pages > 1 && (
            <nav className="catalog-pagination" aria-label="Páginas del catálogo">
              {result.page > 1 && (
                <Link href={pageHref(result.page - 1)} aria-label="Página anterior">
                  <ArrowLeft size={16} />
                  Anterior
                </Link>
              )}
              <span>
                Página {result.page} de {result.pages}
              </span>
              {result.page < result.pages && (
                <Link href={pageHref(result.page + 1)} aria-label="Página siguiente">
                  Siguiente
                  <ArrowRight size={16} />
                </Link>
              )}
            </nav>
          )}
          <div className="catalog-assistance">
            <MessageCircle size={22} />
            <div>
              <strong>¿No encontrás la medida?</strong>
              <p>Consultanos. Te ayudamos a armar tu proyecto.</p>
            </div>
            <Link href="/contacto" className="text-link">
              Hablemos <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
