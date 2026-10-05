import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { listCategories, listProducts } from "@/features/products/queries";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    listCategories(),
    listProducts({ featured: true }),
  ]);

  return (
    <div>
      <section className="at-hero bg-ink text-background">
        <div className="at-hero-grid">
          <div className="at-hero-copy">
            <p className="at-hero-kicker font-mono">Depósito en Tandil</p>
            <h1 className="at-hero-title">Elegí los materiales y cerrá el pedido.</h1>
            <p className="at-hero-lead">
              Tejido, postes y portones con stock real. Armás la lista y la confirmamos por WhatsApp.
            </p>
            <Button className="at-hero-cta" nativeButton={false} render={<Link href="/productos" />}>
              Ver productos
            </Button>
            <p className="at-hero-address">
              {site.address}. {site.addressDetail}
            </p>
          </div>
          <div className="at-hero-media">
            <Image
              src="/hero-alambrado.jpg"
              alt="Rollos de tejido galvanizado, postes de hormigón y un portón en el depósito"
              width={1280}
              height={720}
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="at-hero-img"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-heading text-3xl">Categorías</h2>
        {categories.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Las familias de producto se cargan con el catálogo.</p>
        ) : (
        <div className="cat-grid">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/productos/${category.slug}`}
              className={`cat-cell ${index === 0 ? "cat-span" : ""}`}
            >
              <p className="font-heading text-2xl">{category.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {category._count.products} {category._count.products === 1 ? "producto" : "productos"}
              </p>
            </Link>
          ))}
        </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl">En el depósito</h2>
          <Link href="/productos" className="text-sm underline">
            Ver catálogo
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Todavía no hay productos destacados.</p>
        ) : (
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        )}
      </section>

      <section className="border-y border-border bg-secondary">
        <ol className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
          <li>
            <p className="font-mono text-sm text-primary">01</p>
            <p className="mt-2 font-heading text-2xl">Elegís la mercadería</p>
            <p className="mt-2 text-sm text-muted-foreground">Variante, cantidad y unidad, con el stock del depósito.</p>
          </li>
          <li>
            <p className="font-mono text-sm text-primary">02</p>
            <p className="mt-2 font-heading text-2xl">Armás el pedido</p>
            <p className="mt-2 text-sm text-muted-foreground">Nombre, teléfono y si es retiro o envío.</p>
          </li>
          <li>
            <p className="font-mono text-sm text-primary">03</p>
            <p className="mt-2 font-heading text-2xl">Cerramos la venta</p>
            <p className="mt-2 text-sm text-muted-foreground">El pedido queda guardado y se confirma por WhatsApp.</p>
          </li>
        </ol>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <p className="font-mono text-sm">Tandil</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Local de alambrados sobre la colectora de la Ruta 226.
            </p>
          </div>
          <div>
            <p className="font-mono text-sm">Romboidal SA</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Trabajamos tejidos de un fabricante con certificado INTI.
            </p>
          </div>
          <div>
            <p className="font-mono text-sm">{site.address}</p>
            <p className="mt-2 text-sm text-muted-foreground">{site.addressDetail}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
