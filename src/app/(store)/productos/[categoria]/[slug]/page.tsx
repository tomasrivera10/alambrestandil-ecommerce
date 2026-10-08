import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { VariantPicker } from "@/components/store/variant-picker";
import { FadeContent } from "@/components/store/fade-content";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductSelection } from "@/components/store/product-selection";
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
    ? product.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        isReference: image.isReference,
        sourceUrl: image.sourceUrl,
      }))
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
      <ProductSelection key={product.id} variants={product.variants} images={images}>
        <FadeContent className="product-detail-grid">
          <div className="product-summary">
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
          </div>
          <ProductGallery images={images} name={product.name} reference={Boolean(reference)} />
          <div className="product-detail-copy">
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
          </div>
        </FadeContent>
      </ProductSelection>
      <section className="product-information" aria-labelledby="product-description-title">
        <div>
          <h2 id="product-description-title">Sobre este producto</h2>
          <p>{product.technicalDescription?.trim() || product.shortDescription}</p>
          {product.uses.length > 0 && (
            <div className="product-uses">
              <h3>Usos recomendados</h3>
              <ul>
                {product.uses.map((use) => (
                  <li key={use}>{use}</li>
                ))}
              </ul>
            </div>
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
        </div>
        <div className="product-order-guide">
          <h3>Del catálogo a tu proyecto</h3>
          <ol>
            <li>Elegí la medida y la cantidad que necesitás.</li>
            <li>Agregá los materiales a tu pedido y completá tus datos.</li>
            <li>Continuá por WhatsApp para confirmar precio, disponibilidad y entrega.</li>
          </ol>
          <Link href="/calcular-alambrado" className="text-link">
            Calculá los materiales de tu cerco <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
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
