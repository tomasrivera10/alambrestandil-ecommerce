"use client";

import { useState } from "react";
import styles from "./site-header.module.css";
import Link from "next/link";
import { Calculator, ChevronDown, MapPin, MessageCircle, Truck } from "lucide-react";
import { CartSheet } from "./cart-sheet";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
import { HeaderSearch } from "./header-search";
import { storeNavigation, useStoreNavigation } from "./store-navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader({ categories }: { categories: { slug: string; name: string }[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeSection, current } = useStoreNavigation(menuOpen);
  return (
    <header data-store-header className={styles["commerce-header"]}>
      <div className={`store-container ${styles["commerce-header-inner"]}`}>
        <MobileMenu
          activeSection={activeSection}
          current={current}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        />
        <Link href="/" className={styles["commerce-brand"]} aria-label="Alambres Tandil, inicio">
          <BrandLogo />
        </Link>
        <HeaderSearch />
        <Link href="/contacto" className={styles["commerce-shipping"]}>
          <span><Truck size={23} strokeWidth={1.6} aria-hidden="true" /> ENVÍOS</span>
          <strong>EN TANDIL</strong>
        </Link>
        <Link href="/contacto" className={styles["commerce-location"]}>
          <MapPin size={25} strokeWidth={1.4} aria-hidden="true" />
          <span><small>Estamos en Tandil</small>Ijurco 1480</span>
        </Link>
        <nav className={styles["commerce-nav"]} aria-label="Navegación principal">
          {storeNavigation.map(({ label, href, section }) => (
            <DropdownMenu key={href} modal={false}>
              <DropdownMenuTrigger
                openOnHover
                delay={220}
                closeDelay={160}
                className={styles["commerce-products-trigger"]}
                data-active={activeSection === section || undefined}
              >
                {label} <ChevronDown size={14} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={2}
                className={styles["commerce-categories"]}
                aria-label="Categorías de productos"
              >
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.slug}
                    className={styles["commerce-category"]}
                    render={<Link href={`/productos/${category.slug}`} />}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
                {categories.length > 0 && <DropdownMenuSeparator className={styles["commerce-category-divider"]} />}
                <DropdownMenuItem
                  className={`${styles["commerce-category"]} ${styles["commerce-category-all"]}`}
                  render={<Link href={href} aria-current={activeSection === section ? current : undefined} />}
                >
                  Ver todos los productos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <Link href="/#home-products-title">Ofertas</Link>
          <Link href="/instalaciones" aria-current={activeSection === "instalaciones" ? current : undefined}>Instalaciones</Link>
          <Link href="/nosotros" aria-current={activeSection === "nosotros" ? current : undefined}>Nosotros</Link>
        </nav>
        <div className={styles["commerce-actions"]}>
          <Link
            href="/calcular-alambrado"
            aria-current={activeSection === "calcular-alambrado" ? current : undefined}
            className={styles["commerce-tool"]}
            aria-label="Calculá tu alambrado"
            title="Calculá tu alambrado"
          >
            <Calculator size={18} aria-hidden="true" /><span>Calculá tu cerco</span>
          </Link>
          <Link
            href="/contacto"
            aria-current={activeSection === "contacto" ? current : undefined}
            className={`${styles["commerce-tool"]} ${styles["commerce-contact"]}`}
            aria-label="Contacto"
            title="Contacto"
          >
            <MessageCircle size={19} aria-hidden="true" /><span>Ayuda</span>
          </Link>
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
