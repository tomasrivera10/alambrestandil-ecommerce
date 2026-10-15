"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SectionNav({ kind }: { kind: "products" | "orders" }) {
  const pathname = usePathname();
  const links =
    kind === "products"
      ? [
          ["/admin/productos", "Catálogo"],
          ["/admin/categorias", "Categorías"],
        ]
      : [
          ["/admin/pedidos", "Pedidos"],
          ["/admin/ventas", "Ventas de mostrador"],
          ["/admin/cotizaciones", "Presupuestos"],
        ];
  return (
    <nav
      className="admin-section-nav"
      aria-label={kind === "products" ? "Productos" : "Pedidos y ventas"}
    >
      {links.map(([href, label]) => (
        <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
