import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { can, getSession, isRole } from "@/lib/rbac";
import { AdminNav } from "@/components/admin/admin-nav";
import "../admin.css";

const groups = [
  {
    label: "Operación",
    links: [
      { href: "/admin", label: "Inicio", area: "orders" as const },
      { href: "/admin/pedidos", label: "Pedidos", area: "orders" as const },
      { href: "/admin/ventas", label: "Ventas", area: "orders" as const },
      { href: "/admin/cotizaciones", label: "Cotizaciones", area: "quotes" as const },
      { href: "/admin/clientes", label: "Clientes", area: "customers" as const },
    ],
  },
  {
    label: "Catálogo e inventario",
    links: [
      { href: "/admin/stock", label: "Stock", area: "inventory" as const },
      { href: "/admin/productos", label: "Productos", area: "products" as const },
      { href: "/admin/proveedores", label: "Proveedores", area: "suppliers" as const },
      { href: "/admin/categorias", label: "Categorías", area: "products" as const },
    ],
  },
  {
    label: "Análisis",
    links: [
      { href: "/admin/metricas", label: "Métricas", area: "metrics" as const },
      { href: "/admin/configuracion", label: "Configuración", area: "settings" as const },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const role = "role" in session.user ? String(session.user.role) : "";
  if (!isRole(role)) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">AT</span>
          <span>
            <strong>Alambres Tandil</strong>
            <small>Panel de administración</small>
          </span>
        </Link>
        <AdminNav
          groups={groups
            .map((group) => ({
              ...group,
              links: group.links.filter((link) => role === "ADMIN" || can(role, link.area)),
            }))
            .filter((group) => group.links.length > 0)}
        />
        <div className="admin-sidebar-footer">
          <p>{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await auth.api.signOut({ headers: await headers() });
              redirect("/admin/login");
            }}
          >
            <button type="submit">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>La casa del alambrado</span>
          <span>
            {role === "ADMIN" ? "Administración" : role === "STOCK" ? "Depósito" : "Ventas"}
          </span>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
