"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
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
import { storeNavigation } from "./store-navigation";
export function MobileMenu({
  activeSection,
  current,
  open,
  onOpenChange,
}: {
  activeSection: string;
  current: "page" | "location";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sectionOnOpen, setSectionOnOpen] = useState(activeSection);
  const selectedSection = open ? sectionOnOpen : activeSection;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu-button"
            aria-label="Abrir menú"
            onClickCapture={() => {
              setSectionOnOpen(activeSection);
            }}
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
          <SheetDescription>Materiales e instalación para tu cerco.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navegación móvil" className="mobile-menu-links">
          {[
            ...storeNavigation,
            {
              label: "Calculá tu alambrado",
              href: "/calcular-alambrado",
              section: "calcular-alambrado",
            },
            { label: "Contacto", href: "/contacto", section: "contacto" },
          ].map(({ label, href, section }) => (
            <Link
              key={href}
              href={href}
              aria-current={selectedSection === section ? current : undefined}
              onClick={() => onOpenChange(false)}
            >
              {label}
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <p className="mobile-menu-address">Encontranos en Ijurco 1480, Tandil.</p>
      </SheetContent>
    </Sheet>
  );
}
