import Link from "next/link";
import { CartSheet } from "@/components/store/cart-sheet";
import { site } from "@/content/site";

const links = [
  { href: "/productos", label: "Productos" },
  { href: "/soluciones", label: "Soluciones" },
  { href: "/instalaciones", label: "Instalaciones" },
  { href: "/calcular-alambrado", label: "Calcular" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="min-w-0">
          <span className="block font-heading text-lg leading-none tracking-tight">{site.name}</span>
          <span className="text-[11px] text-muted-foreground">{site.tagline}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/buscar" className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-xs">
          <label className="sr-only" htmlFor="q">
            Buscar productos
          </label>
          <input
            id="q"
            name="q"
            placeholder="tejido 1.80, poste olímpico"
            className="h-10 w-full border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring"
          />
        </form>
        <CartSheet />
      </div>
      <form action="/buscar" className="border-t border-border px-4 py-2 md:hidden">
        <label className="sr-only" htmlFor="qm">
          Buscar productos
        </label>
        <input
          id="qm"
          name="q"
          placeholder="Buscar tejido, poste, malla"
          className="h-10 w-full border border-input bg-card px-3 text-sm"
        />
      </form>
    </header>
  );
}
