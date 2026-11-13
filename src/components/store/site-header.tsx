"use client";

import { useState } from "react";
import styles from "./site-header.module.css";
import Link from "next/link";
import { Calculator, MessageCircle } from "lucide-react";
import { CartSheet } from "./cart-sheet";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
import { HeaderSearch } from "./header-search";
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
        <HeaderSearch />
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
