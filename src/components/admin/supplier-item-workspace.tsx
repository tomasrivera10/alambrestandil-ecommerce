"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { X, ArrowUpRight } from "lucide-react";
import styles from "./supplier-item-workspace.module.css";

export function SupplierItemWorkspace({
  name,
  linked,
  linking,
  pricing,
}: {
  name: string;
  linked: boolean;
  linking: ReactNode;
  pricing: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [section, setSection] = useState<"link" | "price">(linked ? "price" : "link");
  return (
    <>
      <button
        type="button"
        className={`admin-button-secondary ${styles.trigger}`}
        onClick={() => dialog.current?.showModal()}
      >
        {linked ? "Gestionar" : "Configurar"} <ArrowUpRight size={15} />
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.surface}>
          <header className={styles.header}>
            <h2 id={titleId}>{name}</h2>
            <button
              type="button"
              className={styles.close}
              aria-label="Cerrar artículo"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </header>
          <nav className={styles.navigation} aria-label="Gestión del artículo">
            <button
              type="button"
              aria-pressed={section === "link"}
              onClick={() => setSection("link")}
            >
              Producto vinculado
            </button>
            <button
              type="button"
              aria-pressed={section === "price"}
              onClick={() => setSection("price")}
            >
              Precio de venta
            </button>
          </nav>
          <div className={styles.body}>
            <div hidden={section !== "link"} className={styles.linking}>
              <h3>Vincular con la tienda</h3>
              <p className="admin-help">
                Elegí la misma presentación y unidad que ofrece el proveedor.
              </p>
              {linking}
            </div>
            <div hidden={section !== "price"}>{pricing}</div>
          </div>
        </div>
      </dialog>
    </>
  );
}
