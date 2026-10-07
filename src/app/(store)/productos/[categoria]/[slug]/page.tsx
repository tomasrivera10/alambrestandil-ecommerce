import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { VariantPicker } from "@/components/store/variant-picker";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductCard } from "@/components/store/product-card";
import { getProductBySlug } from "@/features/products/queries";
import { categoryPhotos } from "@/content/storefront";
import { site } from "@/content/site";
import { whatsappUrl } from "@/features/whatsapp/message";
import { unitLabel } from "@/lib/format";
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
  if (!product) notFound();
  const href = `/productos/${categoria}/${slug}`;
  const wa = whatsappUrl(
    site.phoneDigits,
    `Hola Alambres Tandil. Quiero consultar por ${product.name}.`,
  );
  const reference = product.images.length === 0 ? categoryPhotos[categoria] : null;
  const images = product.images.length
    ? product.images.map((image) => ({ url: image.url, alt: image.alt }))
    : reference
      ? [{ url: reference.src, alt: `Imagen de referencia: ${reference.alt}` }]
      : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
  };
  return (
    <div className="store-container product-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="store-breadcrumb" aria-label="Ruta del producto">
        <Link href="/productos">Productos</Link>
        <ChevronRight size={12} />
        <Link href={`/productos/${categoria}`}>{product.category.name}</Link>
        <ChevronRight size={12} />
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-grid">
        <ProductGallery images={images} name={product.name} reference={Boolean(reference)} />
        <div className="product-detail-copy">
          <Link href={`/productos/${categoria}`} className="product-category">
            {product.category.name}
          </Link>
          <h1>{product.name}</h1>
          <p className="product-intro">{product.shortDescription}</p>
          <div className="product-brand-line">
            <span>Venta por {unitLabel(product.salesUnit, 1)}</span>
            {product.brand && (
              <span>
                Marca: <strong>{product.brand}</strong>
              </span>
            )}
          </div>
          {product.variants.length ? (
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
            <div className="product-unavailable">
              <p>Consultanos por las opciones de este producto.</p>
              <a href={wa} className="store-button">
                Consultar disponibilidad <MessageCircle size={17} />
              </a>
            </div>
          )}
          <div className="product-fulfillment">
            <span>
              <MapPin size={17} />
              Retiro en Ijurco 1480, Tandil
            </span>
            <span>
              <MessageCircle size={17} />
              Precio y entrega a confirmar por WhatsApp
            </span>
          </div>
          <div className="product-details">
            <details open>
              <summary>Características y detalles</summary>
              <p>{product.technicalDescription}</p>
            </details>
            {product.uses.length > 0 && (
              <details>
                <summary>¿Para qué lo puedo usar?</summary>
                <p>{product.uses.join(", ")}</p>
              </details>
            )}
            {product.documentationUrl && (
              <a
                href={product.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Ver documentación técnica <ArrowUpRight size={16} />
              </a>
            )}
            <details>
              <summary>¿Cómo hago el pedido?</summary>
              <p>
                Elegí la variante y cantidad, agregalas a tu pedido y completá tus datos. Guardamos
                la lista y seguimos por WhatsApp para confirmar precio, disponibilidad y entrega.
              </p>
            </details>
          </div>
        </div>
      </div>
      {product.complements.length > 0 && (
        <section className="store-section">
          <div className="section-heading">
            <h2>Completá tu proyecto.</h2>
            <Link href="/productos" className="text-link">
              Ver catálogo <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {product.complements.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
