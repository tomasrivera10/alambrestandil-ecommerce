/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */
import { Package, ArrowUpRight, Plus, ImagePlus } from "lucide-react";
import { PriceDisplay } from "@/components/admin/price-display";
import { unitLabel } from "@/lib/format";
import { SectionNav } from "@/components/admin/section-nav";
import Link from "next/link";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import type { Prisma } from "@/generated/prisma/client";

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireArea("products");
  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const q = value("q").trim(),
    category = value("categoria"),
    photo = value("foto"),
    status = value("estado");
  const where: Prisma.ProductWhereInput = {
    status: status === "ARCHIVED" ? "ARCHIVED" : status === "DRAFT" ? "DRAFT" : "ACTIVE",
    ...(category ? { categoryId: category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            {
              variants: {
                some: {
                  OR: [
                    { sku: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
    ...(photo === "missing"
      ? { images: { none: {} } }
      : photo === "reference"
        ? { images: { some: { isReference: true }, none: { isReference: false } } }
        : photo === "review"
          ? { AND: [{ variants: { some: { reviewNote: { not: null } } } }] }
          : {}),
  };
  const count = await prisma.product.count({ where });
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(value("pagina"))) || 1));
  const [products, categories, missing, review] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            salesUnit: true,
            inventory: { select: { onHand: true, reserved: true, minStock: true } },
          },
        },
        _count: { select: { variants: { where: { active: true } } } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.count({ where: { status: "ACTIVE", images: { none: {} } } }),
    prisma.productVariant.count({
      where: { reviewNote: { not: null }, product: { status: "ACTIVE" } },
    }),
  ]);
  const pageUrl = (n: number) =>
    `/admin/productos?${new URLSearchParams({ q, categoria: category, foto: photo, estado: status, pagina: String(n) })}`;
  const states = { ACTIVE: "Publicado", DRAFT: "Borrador", ARCHIVED: "Archivado" };
  return (
    <div className="max-w-7xl">
      <SectionNav kind="products" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Catálogo de productos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisá fotos, precios y disponibilidad. Abrí un producto para editar sus medidas y
            actualizar el stock físico.
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-button">
          <Plus size={18} /> Agregar producto
        </Link>
      </div>
      <div className="my-6 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4 text-sm">
        <Link className="underline underline-offset-4" href="/admin/productos?foto=missing">
          {missing} productos sin foto
        </Link>
        <Link className="underline underline-offset-4" href="/admin/productos?foto=review">
          {review} variantes para revisar
        </Link>
        <Link className="underline underline-offset-4" href="/admin/stock">
          Gestionar stock
        </Link>
      </div>
      <form
        key={`${q}-${category}-${photo}-${status}`}
        className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <label className="grid gap-1">
          Buscar
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, medida o código SKU"
            className="h-10 min-w-0 border border-input px-3"
          />
        </label>
        <label className="grid gap-1">
          Categoría
          <select
            name="categoria"
            defaultValue={category}
            className="h-10 min-w-0 border border-input px-2"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Imágenes / revisión
          <select name="foto" defaultValue={photo} className="h-10 border border-input px-2">
            <option value="">Todos</option>
            <option value="missing">Sin foto</option>
            <option value="review">Datos a revisar</option>
          </select>
        </label>
        <label className="grid gap-1">
          Estado
          <select name="estado" defaultValue={status} className="h-10 border border-input px-2">
            <option value="ACTIVE">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="ARCHIVED">Archivados</option>
          </select>
        </label>
        <button className="h-10 self-end bg-primary px-4 text-primary-foreground hover:opacity-90">
          Filtrar
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <p>
          {count} productos · Página {page} de {pages}
        </p>
        <Link className="underline" href="/admin/productos">
          Limpiar filtros
        </Link>
      </div>
      <div className="admin-catalog-grid">
        {products.map((p) => (
          <article className="admin-catalog-card" key={p.id}>
            <Link
              href={`/admin/productos/${p.id}`}
              className="admin-catalog-photo"
              aria-label={`Abrir ${p.name}`}
            >
              {p.images[0] ? (
                /* Product photographs may be from supplier HTTPS sources. */ <img
                  src={p.images[0].url}
                  alt={p.images[0].alt}
                  loading="lazy"
                />
              ) : (
                <span>
                  <ImagePlus size={32} strokeWidth={1.5} /> Agregá una foto
                </span>
              )}
              <span className="admin-photo-status">
                {states[p.status]}
              </span>
            </Link>
            <div className="admin-catalog-body">
              <p className="admin-help">
                {p.category.name}
                {p.brand ? ` · ${p.brand}` : ""}
              </p>
              <h2>
                <Link href={`/admin/productos/${p.id}`}>{p.name}</Link>
              </h2>
              <div className="admin-catalog-variants">
                {p.variants.slice(0, 3).map((v) => {
                  const available = (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0);
                  return (
                    <div key={v.id}>
                      <span>{v.name}</span>
                      <strong className={available <= 0 ? "admin-stock-empty" : "admin-stock-ok"}>
                        {available.toLocaleString("es-AR")} {unitLabel(v.salesUnit ?? p.salesUnit)}
                        {available <= 0 ? " · Sin stock" : ""}
                      </strong>
                    </div>
                  );
                })}
                {p.variants.length > 3 && (
                  <Link href={`/admin/productos/${p.id}#stock-producto`}>
                    Ver las {p.variants.length} medidas
                  </Link>
                )}
                {!p.variants.length && (
                  <p className="admin-help">
                    <Package size={14} /> Falta cargar medidas o presentaciones
                  </p>
                )}
              </div>
              <PriceDisplay
                value={
                  p.variants.some((v) => v.price != null)
                    ? Math.min(
                        ...p.variants
                          .map((v) => v.price ?? p.price)
                          .filter((v) => v != null)
                          .map(Number),
                      )
                    : p.price == null
                      ? null
                      : Number(p.price)
                }
                label={
                  p.variants.some((v) => v.price != null)
                    ? "Precio de medidas · desde"
                    : "Precio del producto"
                }
                note={
                  p.priceVisibility === "HIDDEN"
                    ? "En la tienda: a consultar"
                    : p.priceVisibility === "FROM"
                      ? "En la tienda: precio desde"
                      : "Visible en la tienda"
                }
              />
              <div className="admin-catalog-actions">
                <Link
                  className="admin-button-secondary"
                  href={`/admin/productos/${p.id}#stock-producto`}
                >
                  Ingresar stock
                </Link>
                <Link className="admin-text-button" href={`/admin/productos/${p.id}`}>
                  Editar <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && (
        <p className="py-10 text-sm">
          No hay productos con estos filtros. Probá otra búsqueda o limpiá los filtros.
        </p>
      )}
      <nav aria-label="Páginas del catálogo" className="mt-5 flex gap-6 text-sm">
        {page > 1 && (
          <Link className="underline" href={pageUrl(page - 1)}>
            Anterior
          </Link>
        )}
        {page < pages && (
          <Link className="underline" href={pageUrl(page + 1)}>
            Siguiente
          </Link>
        )}
      </nav>
    </div>
  );
}
