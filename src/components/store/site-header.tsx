import Link from "next/link";
import { CartSheet } from "@/components/store/cart-sheet";
import { site } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-ink bg-ink text-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="min-w-0">
          <span className="block font-heading text-lg leading-none tracking-tight">{site.name}</span>
          <span className="text-[11px] text-background/70">{site.tagline}</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/productos" className="hover:underline">
            Productos
          </Link>
        </nav>
        <form action="/buscar" className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-xs">
          <label className="sr-only" htmlFor="q">
            Buscar productos
          </label>
          <input
            id="q"
            name="q"
            placeholder="tejido 1.80, poste olímpico"
            className="h-10 w-full border border-background/20 bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary"
          />
        </form>
        <CartSheet />
      </div>
      <form action="/buscar" className="border-t border-background/15 px-4 py-2 md:hidden">
        <label className="sr-only" htmlFor="qm">
          Buscar productos
        </label>
        <input
          id="qm"
          name="q"
          placeholder="Buscar tejido, poste, malla"
          className="h-10 w-full border border-background/20 bg-background px-3 text-sm text-foreground"
        />
      </form>
    </header>
  );
}
