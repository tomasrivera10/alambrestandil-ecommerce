import Link from "next/link";
import { Search, MapPin, ArrowUpRight } from "lucide-react";
import { CartSheet } from "./cart-sheet";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
export function SiteHeader() {
  return (
    <>
      <div className="store-utility">
        <div className="store-container">
          <span>La Casa del Alambrado · Tandil</span>
          <Link href="/contacto">
            <MapPin size={13} /> Ijurco 1480 <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="store-header">
        <div className="store-container header-main">
          <MobileMenu />
          <Link href="/" className="header-brand" aria-label="Alambres Tandil, inicio">
            <BrandLogo />
          </Link>
          <form action="/buscar" role="search" className="header-search">
            <Search size={19} aria-hidden="true" />
            <label className="sr-only" htmlFor="store-search">
              Buscar productos
            </label>
            <input
              id="store-search"
              name="q"
              placeholder="¿Qué necesitás para tu proyecto?"
              type="search"
              autoComplete="off"
            />
            <button type="submit" aria-label="Buscar">
              <ArrowUpRight size={19} />
            </button>
          </form>
          <Link href="/contacto" className="header-help">
            ¿Necesitás una mano?
            <strong>
              Hablemos <ArrowUpRight size={14} />
            </strong>
          </Link>
          <CartSheet />
        </div>
        <div className="header-nav-wrap">
          <nav className="store-container header-nav" aria-label="Navegación principal">
            <Link href="/productos" className="nav-catalog">
              Productos <ArrowUpRight size={15} />
            </Link>
            <Link href="/soluciones">Soluciones</Link>
            <Link href="/instalaciones">Instalaciones</Link>
            <Link href="/nosotros">Nosotros</Link>
            <Link href="/calcular-alambrado" className="nav-calculator">
              Calculá tu alambrado <ArrowUpRight size={15} />
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
