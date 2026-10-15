/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */
import { Package, ArrowUpRight, Plus, Search, ImagePlus } from "lucide-react";
import { FilterOptions } from "@/components/admin/filter-options";
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
    <main className="admin-page workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Catálogo</h1>
          <p>Encontrá el producto, revisá sus presentaciones y abrí la tarea que necesitás.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-button">
          <Plus size={18} aria-hidden="true" />
          Agregar producto
        </Link>
      </div>
      <SectionNav kind="products" />
      <form
        key={`${q}-${category}-${photo}-${status}`}
        className="workspace-filterbar workspace-catalog-filters"
      >
        <label className="workspace-search">
          <span>Buscar producto</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input name="q" defaultValue={q} placeholder="Nombre, medida o SKU" />
          </div>
        </label>
        <FilterOptions
          activeCount={
            Number(Boolean(category)) +
            Number(Boolean(photo)) +
            Number(Boolean(status && status !== "ACTIVE"))
          }
        >
          <label>
            <span>Categoría</span>
            <select name="categoria" defaultValue={category}>
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Publicación</span>
            <select name="estado" defaultValue={status}>
              <option value="ACTIVE">Publicados</option>
              <option value="DRAFT">Borradores</option>
              <option value="ARCHIVED">Archivados</option>
            </select>
          </label>
          <label>
            <span>Datos pendientes</span>
            <select name="foto" defaultValue={photo}>
              <option value="">Todos</option>
              <option value="missing">Sin foto</option>
              <option value="review">Medidas para revisar</option>
            </select>
          </label>
        </FilterOptions>
        <button type="submit" className="admin-button-secondary">
          Buscar
        </button>
      </form>
      <div className="workspace-review-links" aria-label="Pendientes del catálogo">
        <Link href="/admin/productos?foto=missing">
          <ImagePlus size={16} aria-hidden="true" />
          {missing} productos sin foto
        </Link>
        <Link href="/admin/productos?foto=review">{review} medidas para revisar</Link>
      </div>
      <div className="workspace-results">
        <p>
          {count} productos · Página {page} de {pages}
        </p>
        {(q || category || photo || (status && status !== "ACTIVE")) && (
          <Link href="/admin/productos">Limpiar filtros</Link>
        )}
      </div>
      <div
        className="workspace-table-scroll workspace-catalog-scroll"
        tabIndex={0}
        role="region"
        aria-label="Catálogo de productos"
      >
        <table className="workspace-table workspace-catalog-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentaciones y stock</th>
              <th>Precio de venta</th>
              <th>Publicación</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const prices = p.variants
                .map((v) => v.price ?? p.price)
                .filter((price) => price != null)
                .map(Number);
              const minPrice = prices.length
                ? Math.min(...prices)
                : p.price == null
                  ? null
                  : Number(p.price);
              const inStock = p.variants.filter(
                (v) => (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0) > 0,
              ).length;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="workspace-product-cell">
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="workspace-thumb"
                        aria-label={`Abrir ${p.name}`}
                      >
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt="" loading="lazy" />
                        ) : (
                          <Package size={26} aria-hidden="true" />
                        )}
                      </Link>
                      <div>
                        <Link href={`/admin/productos/${p.id}`} className="workspace-product-name">
                          {p.name}
                        </Link>
                        <p>
                          {p.category.name}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </p>
                        {!p.images.length && (
                          <Link
                            className="workspace-inline-link"
                            href={`/admin/productos/${p.id}#fotos-producto`}
                          >
                            Agregar foto
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link
                      className="workspace-inline-link"
                      href={`/admin/productos/${p.id}#medidas-producto`}
                    >
                      {p.variants.length}{" "}
                      {p.variants.length === 1 ? "presentación" : "presentaciones"}
                    </Link>
                    <p>
                      {p.variants
                        .slice(0, 2)
                        .map((v) => v.name)
                        .join(" · ")}
                      {p.variants.length > 2 ? "…" : ""}
                    </p>
                    <span className={`workspace-stock-status ${inStock === 0 ? "is-low" : ""}`}>
                      {p.variants.length ? `${inStock} con disponibilidad` : "Falta cargar medidas"}
                    </span>
                  </td>
                  <td className="workspace-price" data-label="Precio de venta">
                    <strong>
                      {minPrice == null
                        ? "A confirmar"
                        : minPrice.toLocaleString("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </strong>
                    <p>
                      {prices.length > 1 ? "Desde · " : ""}
                      {p.priceVisibility === "HIDDEN"
                        ? "En la tienda: a consultar"
                        : p.priceVisibility === "FROM"
                          ? "En la tienda: desde"
                          : "Visible en la tienda"}
                    </p>
                  </td>
                  <td data-label="Publicación">
                    <span
                      className={`workspace-publication ${p.status === "ACTIVE" ? "is-published" : ""}`}
                    >
                      {states[p.status]}
                    </span>
                  </td>
                  <td>
                    <div className="workspace-row-actions">
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="admin-button-secondary"
                        aria-label={`Abrir ${p.name}`}
                      >
                        Abrir
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/admin/productos/${p.id}#stock-producto`}
                        className="workspace-inline-link"
                        aria-label={`Ver stock de ${p.name}`}
                      >
                        Ver stock
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!products.length && (
        <div className="workspace-empty">
          <Package size={30} aria-hidden="true" />
          <h2>No encontramos productos con estos filtros</h2>
          <p>Probá con otra medida, el nombre del material o su código.</p>
          <Link href="/admin/productos" className="admin-button-secondary">
            Ver el catálogo
          </Link>
        </div>
      )}
      <nav aria-label="Páginas del catálogo" className="workspace-pagination">
        {page > 1 && <Link href={pageUrl(page - 1)}>Anterior</Link>}
        <span>
          Página {page} de {pages}
        </span>
        {page < pages && <Link href={pageUrl(page + 1)}>Siguiente</Link>}
      </nav>
    </main>
  );
}
