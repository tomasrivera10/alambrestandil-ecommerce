import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PriceTag } from "./price-tag";
import { ProductMedia } from "./product-media";
import { unitLabel } from "@/lib/format";
import { categoryPhotos } from "@/content/storefront";
import type { CatalogProduct } from "@/server/products/queries";
export function ProductCard({ product }: { product: CatalogProduct }) {
  const reference = !product.imageUrl ? categoryPhotos[product.categorySlug] : null;
  const hasPrice = product.priceVisibility !== "HIDDEN" && product.price != null;
  const inStock = product.available != null && product.available > 0;
  return (
    <Link
      href={`/productos/${product.categorySlug}/${product.slug}`}
      className="store-product-card"
      aria-label={`Ver opciones de ${product.name}`}
    >
      <div className="product-card-image">
        <ProductMedia
          src={product.imageUrl ?? reference?.src ?? null}
          alt={product.imageAlt ?? (reference ? `Imagen de referencia: ${reference.alt}` : null)}
          name={product.name}
          ratio="aspect-square"
        />
        <span className="product-card-arrow">
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>
      <div className="product-card-copy">
        <p className="product-category">{product.brand || product.categoryName}</p>
        <h3>{product.name}</h3>
        <p className="product-card-description">{product.shortDescription}</p>
        <div className="product-card-purchase">
          <div className="product-card-price">
            <PriceTag visibility={product.priceVisibility} price={product.price} layout="catalog" />
            {hasPrice && (
              <span className="product-card-unit">por {unitLabel(product.salesUnit, 1)}</span>
            )}
          </div>
          <span className={`product-stock${inStock ? " product-stock-available" : ""}`}>
            {inStock ? "Stock disponible" : "Consultar disponibilidad"}
          </span>
          <span className="product-card-cta">
            Ver opciones <ChevronRight size={17} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
