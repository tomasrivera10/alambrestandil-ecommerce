import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { solutions } from "@/content/solutions";
import { listCategories, listProducts } from "@/features/products/queries";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    listCategories(),
    listProducts({ featured: true }),
  ]);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-end gap-8 px-4 pt-10 pb-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <h1 className="max-w-xl font-heading text-4xl leading-[1.05] text-ink md:text-6xl">
            Todo para tu alambrado, en un solo lugar.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Elegí los materiales. Nosotros te ayudamos con medidas, stock y el cierre por WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/productos" />}>Armá tu pedido</Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/soluciones" />}>
              ¿Qué querés cercar?
            </Button>
          </div>
        </div>
        <div className="mesh-ground min-h-72 border border-border p-6 lg:min-h-[28rem]">
          <p className="max-w-xs bg-card px-3 py-2 text-sm">
            Tejido, postes de hormigón, portones y seguridad perimetral. Local en {site.address}, Tandil.
          </p>
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="font-heading text-3xl">¿Qué querés cercar?</h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {solutions.map((solution) => (
              <li key={solution.slug}>
                <Link
                  href={`/soluciones/${solution.slug}`}
                  className="flex items-baseline justify-between gap-4 py-3 hover:bg-card"
                >
                  <span className="font-heading text-xl">{solution.title}</span>
                  <span className="hidden text-sm text-muted-foreground sm:block">{solution.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-heading text-3xl">Categorías</h2>
        {categories.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Las familias de producto se cargan con el catálogo.</p>
        ) : (
        <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/productos/${category.slug}`}
              className={`bg-background p-5 hover:bg-card ${index === 0 ? "sm:col-span-2 lg:min-h-40" : ""}`}
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

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <h2 className="font-heading text-3xl">Llevar materiales</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed">
            Si ya sabés altura, abertura y metros, armá la lista y la vemos juntos.
          </p>
          <Button className="mt-6" nativeButton={false} render={<Link href="/productos" />}>
            Ir al catálogo
          </Button>
        </div>
        <div className="bg-ink p-6 text-background">
          <h2 className="font-heading text-3xl">Necesito la obra completa</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-background/80">
            Medimos el terreno, definimos tejido y postes, y cotizamos la instalación.
          </p>
          <Button className="mt-6" nativeButton={false} variant="secondary" render={<Link href="/instalaciones" />}>
            Pedir instalación
          </Button>
        </div>
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
