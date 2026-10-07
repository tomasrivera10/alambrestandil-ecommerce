"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "./brand-logo";
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu-button"
            aria-label="Abrir menú"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="store-panel mobile-menu-panel">
        <SheetHeader>
          <SheetTitle>
            <BrandLogo />
          </SheetTitle>
          <SheetDescription>Materiales y soluciones para tu cerco.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navegación móvil" className="mobile-menu-links">
          {[
            ["Productos", "/productos"],
            ["Soluciones", "/soluciones"],
            ["Calculá tu alambrado", "/calcular-alambrado"],
            ["Instalaciones", "/instalaciones"],
            ["Nosotros", "/nosotros"],
            ["Contacto", "/contacto"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </nav>
        <p className="mobile-menu-address">Encontranos en Ijurco 1480, Tandil.</p>
      </SheetContent>
    </Sheet>
  );
}
