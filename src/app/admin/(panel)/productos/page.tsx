import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireArea } from "@/lib/rbac";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Catálogo de productos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Productos reales, medidas y presentaciones. Administrá las fotos, precios y publicación
            desde cada ficha.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Nuevo producto
        </Link>
      </div>
      <div className="my-6 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4 text-sm">
        <Link className="underline underline-offset-4" href="/admin/productos?foto=missing">
          {missing} productos sin foto
        </Link>
        <Link className="underline underline-offset-4" href="/admin/productos?foto=reference">
          Ver fotos de referencia
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
            <option value="reference">Sólo referencia</option>
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
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-y border-border bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Variantes publicadas</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Imagen</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                <td className="p-3">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {p.name}
                  </Link>
                  <small className="mt-1 block text-muted-foreground">
                    {p.brand || "Marca sin confirmar"}
                  </small>
                </td>
                <td className="p-3">{p.category.name}</td>
                <td className="p-3 tabular-nums">{p._count.variants}</td>
                <td className="p-3">
                  {p.priceVisibility === "HIDDEN"
                    ? "A consultar"
                    : p.price
                      ? `${p.priceVisibility === "FROM" ? "Desde " : ""}$ ${p.price.toNumber().toLocaleString("es-AR")}`
                      : "Sin importe"}
                </td>
                <td className="p-3">
                  {!p.images.length
                    ? "Falta foto"
                    : p.images[0].isReference
                      ? "Referencia"
                      : "Foto cargada"}
                </td>
                <td className="p-3">{states[p.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
