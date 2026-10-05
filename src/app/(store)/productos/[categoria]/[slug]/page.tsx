import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceTag } from "@/components/store/price-tag";
import { VariantPicker } from "@/components/store/variant-picker";
import { ProductCard } from "@/components/store/product-card";
import { ProductMedia } from "@/components/store/product-media";
import { site } from "@/content/site";
import { getProductBySlug } from "@/features/products/queries";
import { whatsappUrl } from "@/features/whatsapp/message";

type Props = { params: Promise<{ categoria: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, slug } = await params;
  const product = await getProductBySlug(categoria, slug);
  if (!product) return { title: "Producto" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    alternates: { canonical: `/productos/${categoria}/${slug}` },
    openGraph: { title: product.name, description: product.shortDescription },
  };
}

export default async function ProductPage({ params }: Props) {
  const { categoria, slug } = await params;
  const product = await getProductBySlug(categoria, slug);
  if (!product || product.status === "ARCHIVED") notFound();
  const href = `/productos/${categoria}/${slug}`;
  const message = `Hola Alambres Tandil. Quiero consultar por ${product.name}.`;
  const wa = whatsappUrl(site.phoneDigits, message);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    brand: product.brand,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-muted-foreground">
        <Link href="/productos">Productos</Link> /{" "}
        <Link href={`/productos/${product.category.slug}`}>{product.category.name}</Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {product.images.length === 0 ? (
            <ProductMedia src={null} alt={null} name={product.name} ratio="aspect-[4/3]" />
          ) : (
            product.images.map((image) => (
              <ProductMedia
                key={image.id}
                src={image.url}
                alt={image.alt}
                name={product.name}
                ratio="aspect-[4/3]"
              />
            ))
          )}
        </div>
        <div>
          <h1 className="font-heading text-4xl leading-tight">{product.name}</h1>
          <p className="mt-3 text-sm leading-relaxed">{product.shortDescription}</p>
          <div className="mt-4">
            <PriceTag visibility={product.priceVisibility} price={product.price} />
          </div>
          {product.variants.length > 0 ? (
            <VariantPicker
              variants={product.variants}
              productName={product.name}
              href={href}
              fallbackUnit={product.salesUnit}
              fallbackPrice={product.price}
              priceVisibility={product.priceVisibility}
              imageUrl={product.images[0]?.url ?? null}
              ctaType={product.ctaType}
              whatsappUrl={wa}
            />
          ) : (
            <p className="mt-6 text-sm">Este producto no tiene variantes activas.</p>
          )}
          <div className="mt-8">
            <h2 className="font-heading text-xl">Ficha</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
              {product.technicalDescription}
            </p>
          </div>
          {product.uses.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-heading text-xl">Ideal para</h2>
              <p className="mt-2 text-sm">{product.uses.join(", ")}</p>
            </div>
          ) : null}
        </div>
      </div>
      {product.complements.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-heading text-3xl">También vas a necesitar</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {product.complements.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-3 md:hidden">
        <ButtonLink href="#pedido" label="Agregar al pedido" />
      </div>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="flex h-11 items-center justify-center bg-primary text-sm text-primary-foreground">
      {label}
    </a>
  );
}
