"use client";
/* eslint-disable @next/next/no-img-element -- Admin previews support supplier image hosts. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { loadSupplierItems, type SupplierItemsBatch } from "@/server/suppliers/items";
import { PriceDisplay } from "./price-display";
import styles from "./supplier-item-workspace.module.css";

export function SupplierItemsList({
  supplierId,
  query,
  initial,
}: {
  supplierId: string;
  query: string;
  initial: SupplierItemsBatch;
}) {
  const [items, setItems] = useState(initial.items);
  const [next, setNext] = useState(initial.next);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (busy.current || !next) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const batch = await loadSupplierItems({ supplierId, query, after: next });
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...batch.items.filter((item) => !ids.has(item.id))];
      });
      setNext(batch.next);
    } catch {
      setError("No se pudieron cargar más artículos. Volvé a intentar.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [supplierId, query, next]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !next || error || loading || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, next, error, loading]);

  return (
    <>
      <div className={styles.list} aria-busy={loading}>
        {items.map((item) => {
          const inventory = item.inventory;
          const available = inventory ? inventory.onHand - inventory.reserved : null;
          return (
            <article key={item.id} id={`item-${item.id}`} className={`${styles.row} admin-anchor`}>
              <div className="admin-product-thumb">
                {item.image ? (
                  <img src={item.image.url} alt={item.image.alt} />
                ) : (
                  <Package size={24} />
                )}
              </div>
              <div className={styles.identity}>
                <h3>{item.name}</h3>
                <p>
                  {item.code ? `${item.code} · ` : ""}
                  {item.unit || "Unidad sin aclarar"} · Actualizado {item.updatedAt}
                </p>
                <div className={styles.metadata}>
                  {item.productId ? (
                    <Link href={`/admin/productos/${item.productId}`}>Ver producto y stock</Link>
                  ) : (
                    <span className={styles.warning}>Sin vincular</span>
                  )}
                  {!item.purchased && <span>No comprado</span>}
                  {inventory && available !== null && (
                    <span className={available <= inventory.minStock ? styles.warning : undefined}>
                      {available <= inventory.minStock ? "Reponer · " : ""}Disponible: {available} ·
                      Mínimo: {inventory.minStock}
                    </span>
                  )}
                </div>
              </div>
              <PriceDisplay kind="cost" label="Costo de lista" value={item.cost} />
              <Link
                className={`admin-button-secondary ${styles.trigger}`}
                href={`/admin/proveedores/${supplierId}/articulos/${item.id}`}
              >
                Ver detalle
              </Link>
            </article>
          );
        })}
      </div>
      {!items.length && <p className="admin-empty-inline">No hay artículos para esta búsqueda.</p>}
      <div ref={sentinel} className="py-5">
        <p role="status" className="admin-help">
          {loading
            ? "Cargando más artículos…"
            : `${items.length} artículos cargados${next ? "" : " · Fin de la lista"}`}
        </p>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {next && (
          <button
            type="button"
            className="admin-button-secondary"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {error ? "Reintentar" : "Cargar más artículos"}
          </button>
        )}
      </div>
    </>
  );
}
