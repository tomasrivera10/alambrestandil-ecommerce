"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  House,
  ShoppingBag,
  Package,
  Users,
  Truck,
  ChartNoAxesCombined,
  Warehouse,
  Settings,
  Menu,
  X,
} from "lucide-react";

const icons = {
  "/admin": House,
  "/admin/pedidos": ShoppingBag,
  "/admin/productos": Package,
  "/admin/stock": Warehouse,
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
  const [expanded, setExpanded] = useState(false);
  const active = (href: string) =>
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(`${href}/`)) ||
    (href === "/admin/productos" && pathname === "/admin/categorias") ||
    (href === "/admin/stock" && pathname === "/admin/analisis-stock") ||
    (href === "/admin/pedidos" && ["/admin/ventas", "/admin/cotizaciones"].includes(pathname));
  const current = groups.flatMap((group) => group.links).find((link) => active(link.href));
  return (
    <nav className="admin-nav" aria-label="Panel de administración">
      <button
        type="button"
        className="workspace-menu-toggle"
        aria-expanded={expanded}
        aria-controls="admin-destinos"
        onClick={() => setExpanded(!expanded)}
      >
        <span>{current?.label ?? "Navegación"}</span>
        {expanded ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div id="admin-destinos" className="workspace-destinations" data-expanded={expanded}>
        {groups.map((group) => (
          <div key={group.label} className="admin-nav-group">
            <p>{group.label}</p>
            {group.links.map((link) => {
              const Icon = icons[link.href as keyof typeof icons] ?? Package;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active(link.href) ? "page" : undefined}
                  onClick={() => setExpanded(false)}
                >
                  <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
