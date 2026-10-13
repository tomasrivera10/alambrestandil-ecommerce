import { SectionNav } from "@/components/admin/section-nav";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { CategoryEditor } from "@/components/admin/category-editor";

export default async function CategoriesPage() {
  await requireArea("products");
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        take: 3,
        select: {
          id: true,
          name: true,
          images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 1 },
        },
      },
    },
  });

  return (
    <div className="max-w-6xl">
      <SectionNav kind="products" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Categorías</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Agrupá los productos como los verá el cliente en la tienda. Acá podés crear categorías,
            cambiar su nombre y configurar los filtros que aparecen en cada una.
          </p>
        </div>
        <a
          href="#nueva-categoria"
          className="bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nueva categoría
        </a>
      </div>

      <p className="mt-6 border-y border-border py-3 text-sm text-muted-foreground">
        Para mover un producto de categoría, abrí su ficha desde la imagen o el nombre y cambiá el
        campo “Categoría”. Para cargar o cambiar su foto, hacelo también desde esa ficha.
      </p>

      <div className="mt-2 divide-y divide-border border-b border-border">
        {categories.map((category) => (
          <section key={category.id} className="py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">{category.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category._count.products}{" "}
                  {category._count.products === 1 ? "producto" : "productos"}
                  {category._count.products === 0 && " · No aparece en la tienda"}
                </p>
              </div>
              <Link
                href={`/admin/productos?categoria=${encodeURIComponent(category.id)}`}
                className="text-sm font-medium underline underline-offset-4"
              >
                Ver todos los productos
              </Link>
            </div>

            {category.products.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.products.map((product) => {
                  const photo = product.images[0];
                  return (
                    <Link
                      key={product.id}
                      href={`/admin/productos/${product.id}`}
                      className="flex min-w-0 items-center gap-3 border border-border bg-background p-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-muted text-center text-xs text-muted-foreground">
                        {photo ? (
                          <Image
                            src={photo.url}
                            alt={photo.alt || product.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          "Sin foto"
                        )}
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="block font-medium leading-snug">{product.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {!photo
                            ? "Imagen pendiente"
                            : "Foto del producto"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No hay productos publicados en esta categoría.
              </p>
            )}

            <details className="mt-4 border-t border-border pt-4 text-sm">
              <summary className="w-fit cursor-pointer font-medium underline underline-offset-4">
                Editar categoría
              </summary>
              <CategoryEditor category={category} />
            </details>
          </section>
        ))}
      </div>

      <details id="nueva-categoria" className="mt-8 border border-border p-4 open:pb-2">
        <summary className="cursor-pointer font-medium">Nueva categoría</summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Creá la categoría y después asignale productos desde sus fichas.
        </p>
        <CategoryEditor />
      </details>
    </div>
  );
}
