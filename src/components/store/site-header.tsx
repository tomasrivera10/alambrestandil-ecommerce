"use client";

import { useState } from "react";
import styles from "./site-header.module.css";
import Link from "next/link";
import Form from "next/form";
import { Search, Calculator, MessageCircle } from "lucide-react";
import { CartSheet } from "./cart-sheet";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
import { storeNavigation, useStoreNavigation } from "./store-navigation";

export function SiteHeader() {
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
        <nav className={styles["commerce-nav"]} aria-label="Navegación principal">
          {storeNavigation.map(({ label, href, section }) => (
            <Link
              key={href}
              href={href}
              aria-current={activeSection === section ? current : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Form action="/buscar" role="search" className={styles["commerce-search"]}>
          <label className="sr-only" htmlFor="store-search">
            Buscar productos
          </label>
          <input
            id="store-search"
            name="q"
            placeholder="Buscá productos…"
            type="search"
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar productos">
            <Search size={19} aria-hidden="true" />
          </button>
        </Form>
        <div className={styles["commerce-actions"]}>
          <Link
            href="/calcular-alambrado"
            aria-current={activeSection === "calcular-alambrado" ? current : undefined}
            className={styles["commerce-tool"]}
            aria-label="Calculá tu alambrado"
            title="Calculá tu alambrado"
          >
            <Calculator size={20} aria-hidden="true" />
          </Link>
          <Link
            href="/contacto"
            aria-current={activeSection === "contacto" ? current : undefined}
            className={`${styles["commerce-tool"]} ${styles["commerce-contact"]}`}
            aria-label="Contacto"
            title="Contacto"
          >
            <MessageCircle size={20} aria-hidden="true" />
          </Link>
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
