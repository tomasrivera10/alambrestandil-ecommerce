import Link from "next/link";
import { prisma, safeQuery } from "@/lib/db";

export default async function ProductsAdminPage() {
  const products = await safeQuery(
    () => prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    [],
  );
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Productos</h1>
        <Link href="/admin/productos/nuevo" className="text-sm underline">
          Nuevo
        </Link>
      </div>
      <table className="mt-6 w-full text-left text-sm">
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border">
              <td className="py-2">
                <Link href={`/admin/productos/${product.id}`} className="underline">
                  {product.name}
                </Link>
              </td>
              <td>{product.category.name}</td>
              <td>{product.status}</td>
              <td>{product.priceVisibility}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
