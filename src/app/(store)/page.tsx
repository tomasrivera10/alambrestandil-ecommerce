import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, MapPin, MessageCircle, Ruler, Wrench } from "lucide-react";
import { listProducts } from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { HeroMedia } from "@/components/store/hero-media";
import { FadeContent } from "@/components/store/fade-content";
import { featuredCategories } from "@/content/storefront";
export default async function HomePage() {
  const featured = await listProducts({ featured: true });
  return (
    <>
      <section className="store-hero" data-store-section="productos">
        <HeroMedia videoSrc={process.env.NEXT_PUBLIC_HERO_VIDEO_URL} />
        <div className="hero-shade" />
        <div className="store-container hero-content">
          <h1>
            La casa del
            <br />
            alambrado.
          </h1>
          <p>
            En Tandil, todo para el alambrado y el alambrador.
            <br />
            Tejidos romboidales, accesorios, puertas y portones galvanizados, directo de fábrica.
          </p>
          <div className="hero-actions">
            <Link href="/productos" className="store-button">
              Ver productos y medidas <ArrowUpRight size={19} />
            </Link>
            <Link href="#productos" className="hero-secondary">
              Elegí por categoría <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-footnote">
          <span>Materiales e instalación en Tandil y zona.</span>
          <span>Alambres Tandil · La Casa del Alambrado</span>
        </div>
      </section>
      <div className="service-strip store-container">
        <span>
          <MapPin />
          Retirá en Ijurco 1480, Tandil
        </span>
        <span>
          <MessageCircle />
          Cerrá tu pedido por WhatsApp
        </span>
        <span>
          <Wrench />
          Consultá por instalación
        </span>
      </div>
      <section
        id="productos"
        data-store-section="productos"
        className="store-section store-container home-categories"
        aria-labelledby="categories-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="categories-title">Productos por categoría</h2>
            <p>Elegí el material, revisá las medidas y agregalo a tu pedido.</p>
          </div>
          <Link href="/productos" className="text-link">
            Ver todo el catálogo <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {featuredCategories.map((category) => (
            <Link
              href={`/productos/${category.slug}`}
              className="category-tile"
              key={category.slug}
            >
              <div className="category-photo">
                <Image
                  src={category.src}
                  alt={category.alt}
                  fill
                  sizes="(min-width: 900px) 25vw, 50vw"
                />
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
      {featured.length > 0 && (
        <section
          className="store-section store-container featured-section"
          aria-labelledby="featured-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="featured-title">Productos destacados</h2>
              <p>Tejidos, postes y accesorios para el trabajo de todos los días.</p>
            </div>
            <Link href="/productos" className="text-link">
              Ver productos <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {featured.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
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
              src="/images/tandil/materiales.webp"
              alt="Materiales y postes en el depósito de Alambres Tandil"
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
