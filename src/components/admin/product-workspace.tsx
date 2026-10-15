"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const sections = [
  { id: "medidas-producto", label: "Presentaciones" },
  { id: "stock-producto", label: "Stock" },
  { id: "datos-producto", label: "Datos y publicación" },
  { id: "fotos-producto", label: "Fotos" },
  { id: "precios-producto", label: "Proveedores y precios" },
];
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
const snapshot = () => window.location.hash.slice(1);
const serverSnapshot = () => "medidas-producto";

export function ProductWorkspace({
  presentations,
  stock,
  data,
  photos,
  pricing,
}: {
  presentations: ReactNode;
  stock: ReactNode;
  data: ReactNode;
  photos: ReactNode;
  pricing: ReactNode;
}) {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const active = sections.some((section) => section.id === hash) ? hash : "medidas-producto";
  const content = [presentations, stock, data, photos, pricing];
  return (
    <div className="workspace-product-editor">
      <nav className="workspace-product-nav" aria-label="Tareas del producto">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "location" : undefined}
          >
            {section.label}
          </a>
        ))}
      </nav>
      {sections.map((section, index) => (
        <div
          key={section.id}
          id={section.id}
          hidden={active !== section.id}
          className="workspace-product-panel admin-anchor"
          aria-label={section.label}
        >
          {content[index]}
        </div>
      ))}
    </div>
  );
}
