import { Truck, ArrowUpRight } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import Link from "next/link";
import { prisma } from "@/server/db";
import { requireArea } from "@/server/rbac";
import { createSupplier } from "@/server/suppliers/actions";

export default async function SuppliersPage() {
  await requireArea("suppliers");
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { items: true, lists: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Proveedores</h1>
          <p>Subí listas, revisá costos y definí precios con margen y mercado a la vista.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {suppliers.map((supplier) => (
          <Link
            className="admin-panel block p-5 hover:border-primary"
            key={supplier.id}
            href={`/admin/proveedores/${supplier.id}`}
          >
            <Truck size={24} className="mb-5 text-primary" />
            <h2 className="text-lg font-semibold">{supplier.name}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {supplier._count.items} artículos · {supplier._count.lists} listas
            </p>
            <span className="admin-back mt-5 mb-0">
              Abrir costos y precios <ArrowUpRight size={16} />
            </span>
          </Link>
        ))}
      </div>
      <ActionForm
        action={createSupplier}
        className="admin-panel mt-8 flex flex-wrap items-end gap-3 p-5"
      >
        <label className="grid gap-1 text-sm">
          Nuevo proveedor
          <input
            name="name"
            required
            minLength={2}
            className="admin-input"
            placeholder="Nombre comercial"
          />
        </label>
        <button className="admin-button">Agregar proveedor</button>
      </ActionForm>
    </main>
  );
}
