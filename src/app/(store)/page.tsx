import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calculator, ChevronRight } from "lucide-react";
import { listProducts } from "@/server/products/queries";
import { HomeFeaturedProducts } from "@/components/store/home-featured-products";
import { HomePromoCarousel } from "@/components/store/home-promo-carousel";
import { featuredCategories } from "@/content/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await listProducts();
  const offerSlugs = [
    "clavo-cabeza-perdida",
    "clavo-cabeza-chata-otras",
    "palo-de-eucalipto-3m",
    "postes-de-quebracho",
  ];
  const products = offerSlugs
    .map((slug) => catalog.find((product) => product.slug === slug))
    .filter((product) => product != null);

  const discounts: Record<string, number> = { postes: 0, clavos: 0 };
  for (const product of products) {
    if (product.priceVisibility === "HIDDEN" || product.price == null || product.regularPrice == null || product.regularPrice <= product.price) continue;
    const category = product.categorySlug === "clavos" ? "clavos" : "postes";
    discounts[category] = Math.max(discounts[category], Math.round((1 - product.price / product.regularPrice) * 100));
  }

  return (
    <>
    <section id="productos" data-store-section="productos" className="store-section home-commerce" aria-label="Promociones de productos">
      <HomePromoCarousel discounts={discounts} />
    </section>
    <section className="store-section store-container home-categories" aria-labelledby="categories-title">
      <div className="section-heading">
        <div><h2 id="categories-title">Comprá por categoría</h2><p>Elegí el material que necesitás para tu alambrado.</p></div>
        <Link href="/productos" className="text-link">Ver todo el catálogo <ArrowUpRight size={17} /></Link>
      </div>
      <div className="category-grid">
        {featuredCategories.map((category) => (
          <Link href={`/productos/${category.slug}`} className="category-tile" key={category.slug}>
            <div className="category-photo"><Image src={category.src} alt={category.alt} fill sizes="(min-width: 900px) 25vw, 50vw" /></div>
            <div className="category-copy"><h3>{category.name}</h3><ChevronRight className="navigation-chevron" size={22} strokeWidth={1.75} aria-hidden="true" /><p>{category.detail}</p></div>
          </Link>
        ))}
      </div>
    </section>
    <section className="store-section store-container home-products" aria-labelledby="home-products-title">
      <div className="home-products-heading">
        <div>
          <p className="home-products-eyebrow">Ofertas destacadas</p>
          <h1 id="home-products-title">Oportunidades para tu próximo proyecto</h1>
          <p className="home-products-intro">Clavos con stock y postes seleccionados. Precios promocionales provisorios.</p>
        </div>
        <Link href="/productos" className="home-products-catalog">Ver catálogo completo <ArrowUpRight size={20} aria-hidden="true" /></Link>
      </div>
      <HomeFeaturedProducts products={products} />
      <div className="home-calculator" id="calculadora" data-store-section="calcular-alambrado">
        <Calculator size={32} strokeWidth={1.8} aria-hidden="true" />
        <div>
          <h2>¿Cuánto material necesitás?</h2>
          <p>Calculá lo necesario para tu alambrado.</p>
        </div>
        <Link href="/calcular-alambrado">Calcular materiales <ArrowUpRight size={19} aria-hidden="true" /></Link>
      </div>
    </section>
    </>
  );
}
