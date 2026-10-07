import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, MessageCircle, Ruler, Wrench } from "lucide-react";
import { listProducts } from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { HeroMedia } from "@/components/store/hero-media";
import { BrandCampaign } from "@/components/store/brand-campaign";
import { FadeContent } from "@/components/store/fade-content";
import { featuredCategories } from "@/content/storefront";
export default async function HomePage() {
  const featured = await listProducts({ featured: true });
  return (
    <>
      <section className="store-hero">
        <HeroMedia videoSrc={process.env.NEXT_PUBLIC_HERO_VIDEO_URL} />
        <div className="hero-shade" />
        <div className="store-container hero-content">
          <h1>
            Tu proyecto.
            <br />
            Bien cercado.
          </h1>
          <p>
            Tejidos, postes y portones.
            <br />
            Todo para darle forma a tu espacio.
          </p>
          <div className="hero-actions">
            <Link href="/productos" className="store-button">
              Explorá los productos <ArrowUpRight size={19} />
            </Link>
            <Link href="/instalaciones" className="hero-secondary">
              También lo instalamos <ArrowRight size={17} />
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
          Retirá en nuestro local
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
      <section className="store-section store-container" aria-labelledby="categories-title">
        <div className="section-heading">
          <h2 id="categories-title">
            Todo empieza
            <br />
            por el material.
          </h2>
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
                <ArrowUpRight size={22} />
                <p>{category.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="store-section store-container featured-section">
          <div className="section-heading">
            <div>
              <h2>Listos para tu proyecto.</h2>
              <p>Una selección de nuestro catálogo.</p>
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
      <FadeContent>
        <BrandCampaign />
      </FadeContent>
      <section className="store-section store-container solutions-section">
        <div className="section-heading">
          <h2>
            ¿Qué tenés
            <br />
            en mente?
          </h2>
          <div>
            <p>
              Cada espacio pide su propio cerco.
              <br />
              Encontrá por dónde empezar.
            </p>
            <Link href="/soluciones" className="text-link">
              Todas las soluciones <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="solution-photo-grid">
          <Link href="/soluciones/cerrar-un-terreno" className="solution-photo">
            <Image
              src="/images/tandil/tejido.webp"
              alt="Cerco y portón en un terreno de Tandil"
              fill
              sizes="(min-width: 800px) 60vw, 100vw"
            />
            <div>
              <h3>
                Un terreno.
                <br />
                Muchas posibilidades.
              </h3>
              <span>
                Cerrá tu terreno <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
          <Link href="/soluciones/cercar-una-casa" className="solution-photo">
            <Image
              src="/images/tandil/rombogreen.webp"
              alt="Cerco verde revestido para una vivienda"
              fill
              sizes="(min-width: 800px) 40vw, 100vw"
            />
            <div>
              <h3>
                Tu espacio.
                <br />
                Tu privacidad.
              </h3>
              <span>
                Conocé los revestidos <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="project-help">
        <div className="store-container project-help-grid">
          <div>
            <Ruler size={36} strokeWidth={1.5} />
            <h2>
              De la medida
              <br />a los materiales.
            </h2>
            <p>
              ¿Ya tenés los metros? Usá la calculadora para preparar una lista estimada y la
              revisamos juntos.
            </p>
            <Link href="/calcular-alambrado" className="store-button">
              Calculá tu alambrado <ArrowUpRight size={18} />
            </Link>
          </div>
          <div>
            <Wrench size={36} strokeWidth={1.5} />
            <h2>
              Nos ocupamos
              <br />
              del cerco completo.
            </h2>
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
        <section className="store-section store-container local-story">
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
              Somos de acá.
              <br />
              Estamos para vos.
            </h2>
            <p>
              Desde 2018, en Alambres Tandil acompañamos a quienes construyen, cercan y transforman
              sus espacios. Con materiales, asesoramiento y una conversación directa.
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
