"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ShoppingBag,
  Package,
  Users,
  Truck,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";
const icons = {
  "/admin": House,
  "/admin/pedidos": ShoppingBag,
  "/admin/productos": Package,
  "/admin/clientes": Users,
  "/admin/proveedores": Truck,
  "/admin/metricas": ChartNoAxesCombined,
  "/admin/configuracion": Settings,
};
export function AdminNav({
  groups,
}: {
  groups: { label: string; links: { href: string; label: string }[] }[];
}) {
  const pathname = usePathname();
  const active = (href: string) =>
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(`${href}/`)) ||
    (href === "/admin/productos" && ["/admin/stock", "/admin/categorias"].includes(pathname)) ||
    (href === "/admin/pedidos" && ["/admin/ventas", "/admin/cotizaciones"].includes(pathname));
  const links = (group: (typeof groups)[number]) =>
    group.links.map((link) => {
      const Icon = icons[link.href as keyof typeof icons] ?? Package;
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={active(link.href) ? "page" : undefined}
        >
          <Icon size={19} strokeWidth={1.7} />
          {link.label}
        </Link>
      );
    });
  return (
    <nav className="admin-nav" aria-label="Panel de administración">
      {groups.map((group, index) =>
        index === 0 ? (
          <div key={group.label} className="admin-nav-group">
            {links(group)}
          </div>
        ) : (
          <details
            key={group.label}
            className="admin-nav-tools"
            open={group.links.some((link) => active(link.href))}
          >
            <summary>{group.label}</summary>
            <div className="admin-nav-group">{links(group)}</div>
          </details>
        ),
      )}
    </nav>
  );
}
