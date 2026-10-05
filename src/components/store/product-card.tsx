import Link from "next/link";
import { PriceTag } from "@/components/store/price-tag";
import { ProductMedia } from "@/components/store/product-media";
import type { CatalogProduct } from "@/features/products/queries";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      href={`/productos/${product.categorySlug}/${product.slug}`}
      className="group grid content-start gap-3"
    >
      <ProductMedia src={product.imageUrl} alt={product.imageAlt} name={product.name} />
      <div className="grid gap-1">
        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
        <h3 className="font-heading text-lg leading-tight group-hover:underline">{product.name}</h3>
        <PriceTag visibility={product.priceVisibility} price={product.price} />
      </div>
    </Link>
  );
}
