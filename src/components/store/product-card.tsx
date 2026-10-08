import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PriceTag } from "./price-tag";
import { ProductMedia } from "./product-media";
import { categoryPhotos } from "@/content/storefront";
import type { CatalogProduct } from "@/features/products/queries";
export function ProductCard({ product }: { product: CatalogProduct }) {
  const reference = !product.imageUrl ? categoryPhotos[product.categorySlug] : null;
  return (
    <Link
      href={`/productos/${product.categorySlug}/${product.slug}`}
      className="store-product-card"
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
        <div className="product-card-price">
          <PriceTag visibility={product.priceVisibility} price={product.price} />
        </div>
        <span className="product-stock">
          {product.available && product.available > 0
            ? "Stock disponible"
            : "Consultar disponibilidad"}
        </span>
      </div>
    </Link>
  );
}
