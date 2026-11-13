"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import type { CatalogProduct } from "@/server/products/queries";

const filters = [
  { label: "Todos", matches: () => true },
  { label: "Postes y puntales", matches: (slug: string) => slug.includes("poste") || slug.includes("puntal") },
  { label: "Clavos", matches: (slug: string) => slug === "clavos" },
];

export function HomeFeaturedProducts({ products }: { products: CatalogProduct[] }) {
  const [selected, setSelected] = useState("Todos");
  const current = filters.find((filter) => filter.label === selected) ?? filters[0];
  const visible = products.filter((product) => current.matches(product.categorySlug)).slice(0, 4);

  return (
    <>
      <div className="home-product-filters" role="group" aria-label="Filtrar productos destacados">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={selected === filter.label}
            onClick={() => setSelected(filter.label)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {visible.length > 0 ? (
        <div className="home-product-grid">
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className="home-products-empty">Todavía no hay destacados en esta categoría. Encontrá más opciones en el catálogo.</p>
      )}
    </>
  );
}
