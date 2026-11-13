/* eslint-disable @next/next/no-img-element -- Admin product photos can be hosted by suppliers. */
import Link from "next/link";
import { Package, Plus, Search, ArrowUpRight } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { ActionForm } from "@/components/admin/action-form";
import { SectionNav } from "@/components/admin/section-nav";
import { saveCatalogProduct, saveCatalogVariant } from "@/server/products/catalog-pricing";
import { activeOffer } from "@/server/products/offer";
import "./pricing.css";

const money = (value: { toString(): string } | null) => value?.toString().replace(".", ",") ?? "";
const amount = (value: { toString(): string } | null) =>
  value == null ? null : Number(value.toString());
const ars = (value: number) =>
  value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const day = (value: Date | null) =>
  value ? new Date(value.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10) : "";

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireArea("products");
  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? String(params[key]) : "");
  const q = value("q").trim();
  const category = value("categoria");
  const status = value("estado");
  const promotion = value("promocion");
  const where: Prisma.ProductWhereInput = {
    ...(category ? { categoryId: category } : {}),
    ...(status === "published"
      ? { status: "ACTIVE" }
      : status === "draft"
        ? { status: { not: "ACTIVE" } }
        : {}),
    ...(promotion === "yes"
      ? {
          OR: [
            { discountPrice: { not: null } },
            { variants: { some: { discountPrice: { not: null } } } },
          ],
        }
      : {}),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                {
                  variants: {
                    some: {
                      OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { sku: { contains: q, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };
  const [count, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(value("pagina"))) || 1));
  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: {
        where: { active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          purchasePrice: true,
          discountPrice: true,
          inventory: { select: { onHand: true, reserved: true } },
        },
      },
    },
    orderBy: { name: "asc" },
    skip: (page - 1) * 20,
    take: 20,
  });
  const pageUrl = (n: number) =>
    `/admin/productos?${new URLSearchParams({ q, categoria: category, estado: status, promocion: promotion, pagina: String(n) })}`;
  return (
    <main className="admin-page catalog-pricing">
      <div className="catalog-pricing-head">
        <div>
          <p className="catalog-pricing-eyebrow">Mesa de precios</p>
          <h1>Catálogo</h1>
          <p>Buscá un producto, ajustá sus precios y decidí si aparece en la web.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-button">
          <Plus size={17} /> Agregar producto
        </Link>
      </div>
      <SectionNav kind="products" />
      <form className="catalog-pricing-filters">
        <label className="catalog-pricing-search">
          <span className="sr-only">Buscar producto</span>
          <Search size={18} />
          <input name="q" defaultValue={q} placeholder="Buscar por producto, medida o SKU" />
        </label>
        <label>
          <span className="sr-only">Categoría</span>
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
          <span className="sr-only">Publicación</span>
          <select name="estado" defaultValue={status}>
            <option value="">Todos</option>
            <option value="published">En la web</option>
            <option value="draft">Sin publicar</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Promociones</span>
          <select name="promocion" defaultValue={promotion}>
            <option value="">Todas las promociones</option>
            <option value="yes">Con oferta</option>
          </select>
        </label>
        <button className="admin-button-secondary">Filtrar</button>
      </form>
      <div className="catalog-pricing-results">
        <span>
          {count} {count === 1 ? "producto" : "productos"} · Página {page} de {pages}
        </span>
        {(q || category || status || promotion) && (
          <Link href="/admin/productos">Limpiar filtros</Link>
        )}
      </div>
      <div className="catalog-pricing-list">
        {products.map((product) => {
          const sale = amount(product.price);
          const offer = activeOffer(
            sale,
            amount(product.discountPrice),
            product.promotionStartsAt,
            product.promotionEndsAt,
          );
          const published = product.status === "ACTIVE";
          return (
            <article className="catalog-pricing-card" key={product.id}>
              <div className="catalog-pricing-ident">
                <div className="catalog-pricing-image">
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt="" loading="lazy" />
                  ) : (
                    <Package size={28} />
                  )}
                </div>
                <div>
                  <p className="catalog-pricing-meta">
                    {product.category.name}
                    {product.sku ? ` · ${product.sku}` : ""}
                  </p>
                  <h2>{product.name}</h2>
                  <p className="catalog-pricing-meta">
                    {product.variants.length}{" "}
                    {product.variants.length === 1 ? "presentación" : "presentaciones"}
                  </p>
                </div>
                <span className={`catalog-pricing-state ${published ? "is-live" : ""}`}>
                  {published ? "En la web" : "Sin publicar"}
                </span>
              </div>
              <ActionForm
                action={saveCatalogProduct}
                className="catalog-pricing-form"
                success="Precios y publicación guardados."
              >
                <input type="hidden" name="productId" value={product.id} />
                <div className="catalog-pricing-fields">
                  <label>
                    Precio compra <span>ARS</span>
                    <input
                      name="purchasePrice"
                      inputMode="decimal"
                      placeholder="Sin cargar"
                      defaultValue={money(product.purchasePrice)}
                    />
                  </label>
                  <label>
                    Precio venta <span>ARS</span>
                    <input
                      name="price"
                      inputMode="decimal"
                      placeholder="Sin cargar"
                      defaultValue={money(product.price)}
                    />
                  </label>
                  <label>
                    Precio descuento <span>ARS</span>
                    <input
                      name="discountPrice"
                      inputMode="decimal"
                      placeholder="Sin oferta"
                      defaultValue={money(product.discountPrice)}
                    />
                  </label>
                  <label className="catalog-pricing-publish">
                    <input type="checkbox" name="published" defaultChecked={published} />
                    <span>Mostrar en la web</span>
                  </label>
                  <button type="submit" className="admin-button">
                    Guardar
                  </button>
                </div>
                <details
                  className="catalog-pricing-promotion"
                  open={Boolean(
                    product.discountPrice ||
                    product.variants.some((variant) => variant.discountPrice),
                  )}
                >
                  <summary>
                    Gestionar promoción{" "}
                    {offer != null ? <strong>· Activa: {ars(offer)}</strong> : ""}
                  </summary>
                  <div>
                    <label>
                      Nombre de la promoción
                      <input
                        name="promotionName"
                        maxLength={80}
                        placeholder="Ej. Liquidación de stock"
                        defaultValue={product.promotionName ?? ""}
                      />
                    </label>
                    <label>
                      Desde
                      <input
                        name="promotionStartsAt"
                        type="date"
                        defaultValue={day(product.promotionStartsAt)}
                      />
                    </label>
                    <label>
                      Hasta
                      <input
                        name="promotionEndsAt"
                        type="date"
                        defaultValue={day(product.promotionEndsAt)}
                      />
                    </label>
                  </div>
                  <p>
                    Sin fechas, la oferta empieza al guardar. Para terminarla, borrá los precios
                    descuento y guardá.
                  </p>
                </details>
              </ActionForm>
              {product.variants.length > 0 && (
                <details className="catalog-pricing-variants">
                  <summary>
                    Precios por presentación <span>({product.variants.length})</span>
                  </summary>
                  <div className="catalog-pricing-variant-list">
                    {product.variants.map((variant) => (
                      <ActionForm
                        key={variant.id}
                        action={saveCatalogVariant}
                        className="catalog-pricing-variant"
                        success="Presentación actualizada."
                      >
                        <input type="hidden" name="variantId" value={variant.id} />
                        <div className="catalog-pricing-variant-name">
                          <strong>{variant.name}</strong>
                          <small>
                            {variant.sku} ·{" "}
                            {Math.max(
                              0,
                              (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0),
                            )}{" "}
                            disponibles
                          </small>
                        </div>
                        <label>
                          Compra
                          <input
                            name="purchasePrice"
                            inputMode="decimal"
                            placeholder="Sin cargar"
                            defaultValue={money(variant.purchasePrice)}
                          />
                        </label>
                        <label>
                          Venta
                          <input
                            name="price"
                            inputMode="decimal"
                            placeholder={sale == null ? "Sin cargar" : `Base ${ars(sale)}`}
                            defaultValue={money(variant.price)}
                          />
                        </label>
                        <label>
                          Descuento
                          <input
                            name="discountPrice"
                            inputMode="decimal"
                            placeholder="Sin oferta"
                            defaultValue={money(variant.discountPrice)}
                          />
                        </label>
                        <button type="submit" className="admin-button-secondary">
                          Guardar medida
                        </button>
                      </ActionForm>
                    ))}
                  </div>
                  <p>
                    Si dejás la venta vacía, esta presentación usa el precio general del producto.
                    El descuento usa las fechas de la promoción general.
                  </p>
                </details>
              )}
              <div className="catalog-pricing-footer">
                <Link href={`/admin/productos/${product.id}`}>
                  Editar ficha, fotos y stock <ArrowUpRight size={14} />
                </Link>
                {published && (
                  <Link
                    href={`/productos/${product.category.slug}/${product.slug}`}
                    target="_blank"
                  >
                    Ver en la web ↗
                  </Link>
                )}
              </div>
            </article>
          );
        })}
        {!products.length && (
          <div className="catalog-pricing-empty">
            <Package size={30} />
            <h2>No encontramos productos</h2>
            <p>Probá con otro nombre, medida o filtro.</p>
            <Link href="/admin/productos" className="admin-button-secondary">
              Ver todo el catálogo
            </Link>
          </div>
        )}
      </div>
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
