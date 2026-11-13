import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, MapPin, MessageCircle, Ruler, Wrench } from "lucide-react";
import { listProducts } from "@/server/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { FadeContent } from "@/components/store/fade-content";
import { featuredCategories } from "@/content/storefront";
import { formatMoney, unitLabel } from "@/lib/format";

// Featured products include current prices and availability.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await listProducts({ featured: true });
  const postSlugs = [
    "palo-de-eucalipto-3m",
    "postes-de-quebracho",
    "poste-esquinero",
    "poste-intermedio",
    "puntal",
  ];
  const offers = [...featured].sort((a, b) => {
    const aOrder = postSlugs.indexOf(a.slug);
    const bOrder = postSlugs.indexOf(b.slug);
    return (aOrder === -1 ? postSlugs.length : aOrder) - (bOrder === -1 ? postSlugs.length : bOrder);
  });
  const pricedOffers = offers
    .filter((product) => product.priceVisibility !== "HIDDEN" && product.price != null)
    .sort((a, b) => {
      const aDiscount = a.regularPrice != null && a.price != null ? 1 - a.price / a.regularPrice : 0;
      const bDiscount = b.regularPrice != null && b.price != null ? 1 - b.price / b.regularPrice : 0;
      return bDiscount - aDiscount;
    })
    .slice(0, 3);
  return (
    <>
      {offers.length > 0 && (
        <section id="productos" data-store-section="productos" className="store-section offers-section home-offers-section" aria-labelledby="offers-title">
          <div className="store-container">
            <h1 id="offers-title" className="sr-only">Postes de madera y hormigón para tu proyecto</h1>
            <Link href="#ofertas-productos" className="offers-campaign" aria-label="Ver productos de postes de madera y hormigón">
              <Image src="/images/postes-madera-hormigon-campana.png" alt="Tu proyecto empieza con buenos postes. Eucalipto, quebracho y hormigón. Ver productos." fill sizes="(min-width: 1440px) 1360px, 100vw" priority />
            </Link>
            {pricedOffers.length > 0 && (
              <div className="campaign-prices" aria-label="Precios destacados">
                {pricedOffers.map((product) => {
                  const discount = product.regularPrice != null && product.price != null
                    ? Math.round((1 - product.price / product.regularPrice) * 100)
                    : 0;
                  return (
                    <Link className="campaign-price" href={`/productos/${product.categorySlug}/${product.slug}`} key={product.id}>
                      <span className="campaign-price-top">
                        <span className="campaign-price-name">{product.name}</span>
                        {discount > 0 && <strong className="campaign-price-off">{discount}% OFF</strong>}
                      </span>
                      <span className="campaign-price-bottom">
                        <span>
                          {discount > 0 && <s>{formatMoney(product.regularPrice)}</s>}
                          <strong>{product.priceVisibility === "FROM" ? "Desde " : ""}{formatMoney(product.price)}</strong>
                          <small>por {unitLabel(product.salesUnit, 1)}</small>
                        </span>
                        <ArrowUpRight size={20} aria-hidden="true" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="offers-products-heading" id="ofertas-productos">
              <div>
                <h2>{offers.some((product) => product.regularPrice != null && product.price != null && product.regularPrice > product.price) ? "Ofertas y destacados" : "Postes destacados"}</h2>
                <p>Precios y opciones para elegir el poste que necesitás.</p>
              </div>
              <Link href="/productos" className="text-link">Ver catálogo completo <ArrowUpRight size={17} /></Link>
            </div>
            <div className="offers-products" role="list">
              {offers.map((product) => (
                <div className="offers-product" role="listitem" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="service-strip store-container home-service-strip">
        <span><MapPin /> Retirá en Ijurco 1480, Tandil</span>
        <span><MessageCircle /> Cerrá tu pedido por WhatsApp</span>
        <span><Wrench /> Consultá por instalación</span>
      </div>
      <section className="store-section store-container home-categories" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <h2 id="categories-title">Comprá por categoría</h2>
            <p>Elegí el material, revisá las medidas y agregalo a tu pedido.</p>
          </div>
          <Link href="/productos" className="text-link">
            Ver todo el catálogo <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {featuredCategories.map((category) => (
            <Link href={`/productos/${category.slug}`} className="category-tile" key={category.slug}>
              <div className="category-photo">
                <Image src={category.src} alt={category.alt} fill sizes="(min-width: 900px) 25vw, 50vw" />
              </div>
              <div className="category-copy">
                <h3>{category.name}</h3>
                <ChevronRight className="navigation-chevron" size={22} strokeWidth={1.75} aria-hidden="true" />
                <p>{category.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="home-catalog-next store-container">
        <p>¿Buscás otro material? Encontrá todas las categorías y medidas en el catálogo.</p>
        <Link href="/productos" className="store-button">
          Ver todos los productos <ArrowUpRight size={18} />
        </Link>
      </div>
      <nav className="home-section-nav store-container" aria-label="Ayuda para tu proyecto">
        <span>¿Necesitás orientación?</span>
        <Link href="#instalaciones">Materiales e instalación</Link>
        <Link href="#nosotros">Conocé el local</Link>
      </nav>
      <section className="project-help">
        <div className="store-container project-help-grid">
          <div id="calculadora" data-store-section="calcular-alambrado">
            <Ruler size={36} strokeWidth={1.5} />
            <h2>Calculá tus materiales</h2>
            <p>
              ¿Ya tenés los metros? Usá la calculadora para preparar una lista estimada y la
              revisamos juntos.
            </p>
            <Link href="/calcular-alambrado" className="store-button">
              Calculá tu alambrado <ArrowUpRight size={18} />
            </Link>
          </div>
          <div id="instalaciones" data-store-section="instalaciones">
            <Wrench size={36} strokeWidth={1.5} />
            <h2>Materiales e instalación</h2>
            <p>
              Materiales y colocación. Contanos cómo es tu terreno y consultá por la instalación en
              Tandil y zona.
            </p>
            <Link href="/instalaciones" className="text-link">
              Pedí un presupuesto <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <FadeContent>
        <section
          id="nosotros"
          data-store-section="nosotros"
          className="store-section store-container local-story"
        >
          <div className="local-story-photo">
            <Image
              src="/images/tandil/historia-alambrados-neri.png"
              alt="Dos chicos frente al antiguo cartel de Alambrados Neri S.H."
              fill
              sizes="(min-width: 800px) 50vw, 100vw"
            />
          </div>
          <div>
            <h2>
              De Tandil.
              <br />
              Con historia en el rubro.
            </h2>
            <p>
              En Alambres Tandil continuamos el legado de Alambrados Neri SH, con más de dos décadas
              de trayectoria en el rubro. Acompañamos a particulares y alambradores con materiales,
              asesoramiento y colocación en toda la ciudad.
            </p>
            <Link href="/nosotros" className="text-link">
              Conocé nuestra historia <ArrowUpRight size={18} />
            </Link>
            <div className="local-story-address">
              <MapPin size={20} />
              <div>
                <strong>Ijurco 1480, Tandil</strong>
                <span>Esquina colectora Macaya · Ruta 226</span>
                <Link href="/contacto">
                  Vení a conocernos <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeContent>
    </>
  );
}
