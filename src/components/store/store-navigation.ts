"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const storeNavigation = [
  { label: "Productos", href: "/productos", section: "productos" },
  { label: "Instalaciones", href: "/instalaciones", section: "instalaciones" },
  { label: "Nosotros", href: "/nosotros", section: "nosotros" },
] as const;

export function useStoreNavigation(paused = false) {
  const pathname = usePathname();
  const [visibleSection, setVisibleSection] = useState("productos");

  useEffect(() => {
    if (pathname !== "/" || paused) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Los paneles bloquean el scroll y desplazan temporalmente el documento.
      if (document.querySelector('[role="dialog"]')) return;
      const header = document.querySelector("[data-store-header]");
      const readingLine = (header?.getBoundingClientRect().bottom ?? 0) + 100;
      let current = "productos";
      for (const section of document.querySelectorAll<HTMLElement>("[data-store-section]")) {
        if (section.getBoundingClientRect().top <= readingLine) {
          current = section.dataset.storeSection ?? current;
        }
      }
      setVisibleSection(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(scheduleUpdate);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [pathname, paused]);

  const activeSection =
    pathname === "/"
      ? visibleSection
      : pathname === "/buscar"
        ? "productos"
        : pathname.split("/")[1];

  return {
    activeSection,
    current: pathname === "/" ? ("location" as const) : ("page" as const),
  };
}
