import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { can, getSession } from "@/lib/rbac";

const links = [
  { href: "/admin", label: "Tablero", area: "orders" as const },
  { href: "/admin/pedidos", label: "Pedidos", area: "orders" as const },
  { href: "/admin/clientes", label: "Clientes", area: "customers" as const },
  { href: "/admin/cotizaciones", label: "Cotizaciones", area: "quotes" as const },
  { href: "/admin/productos", label: "Productos", area: "products" as const },
  { href: "/admin/stock", label: "Stock", area: "inventory" as const },
  { href: "/admin/categorias", label: "Categorías", area: "products" as const },
  { href: "/admin/configuracion", label: "Configuración", area: "settings" as const },
];

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const role = "role" in session.user ? String(session.user.role) : "";

  return (
    <div className="min-h-full bg-background md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-border md:border-r md:border-b-0">
        <div className="px-4 py-4">
          <p className="font-heading text-lg">Alambres Tandil</p>
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        </div>
        <nav className="flex gap-1 overflow-auto px-2 pb-3 md:block md:space-y-1 md:px-2">
          {links
            .filter((link) => role === "ADMIN" || can(role, link.area) || link.href === "/admin")
            .map((link) => (
              <Link key={link.href} href={link.href} className="block px-2 py-2 text-sm hover:bg-muted">
                {link.label}
              </Link>
            ))}
        </nav>
        <form action="/admin/login" className="hidden px-4 py-4 md:block">
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/login" />}>
            Cambiar usuario
          </Button>
        </form>
      </aside>
      <div className="px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
