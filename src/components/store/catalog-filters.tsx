"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { filterLabels } from "@/content/storefront";

type Category = { slug: string; name: string; _count: { products: number } };
export type FilterProps = {
  basePath: string;
  categories: Category[];
  currentCategory?: string;
  brands: string[];
  options: Record<string, string[]>;
  query: Record<string, string>;
  total: number;
};
export function CatalogFilters(props: FilterProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const form = () => (
    <form
      className="filter-form"
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        values.forEach((value, key) => {
          if (String(value).trim()) params.set(key, String(value).trim());
        });
        startTransition(() => router.push(`${props.basePath}${params.size ? `?${params}` : ""}`));
        setOpen(false);
      }}
    >
      <input type="hidden" name="orden" value={props.query.orden ?? ""} />
      <label className="filter-label">
        Buscá un material
        <div className="catalog-search-input">
          <Search size={16} />
          <input
            type="search"
            name="q"
            defaultValue={props.query.q ?? ""}
            placeholder="Nombre, medida o SKU"
          />
        </div>
      </label>
      <div className="filter-group" aria-label="Categorías">
        <h3>Categorías</h3>
        <div className="filter-category-list">
        <Link
          href={categoryLink(props, "")}
          onClick={() => setOpen(false)}
          className={!props.currentCategory ? "filter-category selected" : "filter-category"}
        >
          <span>Todos los productos</span>
        </Link>
        {props.categories.map((category) => (
          <Link
            key={category.slug}
            href={categoryLink(props, category.slug)}
            onClick={() => setOpen(false)}
            className={
              props.currentCategory === category.slug
                ? "filter-category selected"
                : "filter-category"
            }
          >
            <span className="filter-category-name">{category.name}</span>
            <span className="filter-category-trailing">
              <span>{category._count.products}</span>
            </span>
          </Link>
        ))}
        </div>
      </div>
      <div className="filter-refine-heading"><h3>Refiná los resultados</h3><span>{props.total} {props.total === 1 ? "producto" : "productos"}</span></div>
      <div className="filter-fields">
      {(props.brands.length > 0 || props.query.marca) && (
        <label className="filter-label">
          Marca
          <select name="marca" defaultValue={props.query.marca ?? ""}>
            <option value="">Todas las marcas</option>
            {props.brands.map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
            {props.query.marca && !props.brands.includes(props.query.marca) && (
              <option>{props.query.marca}</option>
            )}
          </select>
        </label>
      )}
      {Object.entries(props.options).map(([key, values]) => (
        <label key={key} className="filter-label">
          {filterLabels[key] ?? key}
          <select name={key} defaultValue={props.query[key] ?? ""}>
            <option value="">Todas las opciones</option>
            {values.map((value) => (
              <option key={value}>{value}</option>
            ))}
            {props.query[key] && !values.includes(props.query[key]) && (
              <option>{props.query[key]}</option>
            )}
          </select>
        </label>
      ))}
      </div>
      <label className="availability-filter">
        <input
          type="checkbox"
          name="disponible"
          value="1"
          defaultChecked={props.query.disponible === "1"}
        />
        Solo con stock disponible
      </label>
      <div className="filter-actions">
        <Button className="filter-submit" type="submit" disabled={pending}>
          {pending ? "Buscando…" : `Ver ${props.total} ${props.total === 1 ? "producto" : "productos"}`}
          <ArrowRight size={16} />
        </Button>
        <Link href={props.basePath} className="filter-reset" onClick={() => setOpen(false)}>
          Limpiar filtros
        </Link>
      </div>
    </form>
  );
  return (
    <>
      <aside className="desktop-filters" aria-label="Filtrar productos">
        <div className="filters-title">
          <SlidersHorizontal size={17} />
          <h2>Filtrá tu búsqueda</h2>
        </div>
        {form()}
      </aside>
      <div className="mobile-filters">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="outline" />}>
            <SlidersHorizontal size={16} />
            Filtros
            {Object.keys(props.query).filter((key) => !["pagina", "orden"].includes(key)).length >
              0 && <span className="filter-dot" />}
          </SheetTrigger>
          <SheetContent side="left" className="store-panel filter-panel">
            <SheetHeader>
              <SheetTitle>Encontrá tu material</SheetTitle>
              <SheetDescription>Elegí las opciones y aplicá los filtros.</SheetDescription>
            </SheetHeader>
            <div className="filter-panel-body">{form()}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
function categoryLink(props: FilterProps, slug: string) {
  const params = new URLSearchParams();
  for (const key of ["q", "orden", "marca", "disponible"])
    if (props.query[key]) params.set(key, props.query[key]);
  const path = slug ? `/productos/${slug}` : "/productos";
  return `${path}${params.size ? `?${params}` : ""}`;
}
export function SortCatalog({
  query,
  basePath,
}: {
  query: Record<string, string>;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="catalog-sort">
      Ordenar
      <select
        aria-label="Ordenar productos"
        value={query.orden ?? "destacados"}
        disabled={pending}
        onChange={(event) => {
          const params = new URLSearchParams(query);
          params.set("orden", event.target.value);
          params.delete("pagina");
          startTransition(() => router.push(`${basePath}?${params}`));
        }}
      >
        <option value="destacados">Recomendados</option>
        <option value="nombre">Nombre: A–Z</option>
      </select>
    </label>
  );
}
export function ActiveFilters({
  query,
  basePath,
  allowedKeys,
}: {
  query: Record<string, string>;
  basePath: string;
  allowedKeys: string[];
}) {
  const active = Object.entries(query).filter(([key, value]) => value && allowedKeys.includes(key));
  if (!active.length) return null;
  return (
    <div className="active-filters" aria-label="Filtros activos">
      {active.map(([key, value]) => {
        const params = new URLSearchParams(query);
        params.delete(key);
        params.delete("pagina");
        return (
          <Link
            href={`${basePath}${params.size ? `?${params}` : ""}`}
            key={key}
            aria-label={`Quitar filtro ${filterLabels[key] ?? key}: ${value}`}
          >
            {key === "disponible" ? "Con stock" : key === "q" ? `“${value}”` : value}
            <X size={13} />
          </Link>
        );
      })}
      <Link href={basePath} className="clear-all">
        Limpiar todo
      </Link>
    </div>
  );
}
