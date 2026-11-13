import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/server/products/queries";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], total: 0 });

  const result = await getCatalog({ q });
  return NextResponse.json({
    products: result.products.slice(0, 5).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      imageIsReference: product.imageIsReference,
      priceVisibility: product.priceVisibility,
      price: product.priceVisibility === "HIDDEN" ? null : product.price,
    })),
    total: result.total,
  });
}
