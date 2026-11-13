"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import styles from "./site-header.module.css";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string | null;
  imageIsReference: boolean;
  priceVisibility: "PUBLIC" | "FROM" | "HIDDEN";
  price: number | null;
};

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const normalized = query.trim();

  useEffect(() => {
    if (normalized.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/catalog/suggest?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { products: Suggestion[]; total: number };
        setResults(data.products);
        setTotal(data.total);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalized]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const show = open && normalized.length >= 2;
  const searchHref = `/buscar?q=${encodeURIComponent(normalized)}`;

  return (
    <div className={styles["search-wrap"]} ref={root}>
      <Form action="/buscar" role="search" className={styles["commerce-search"]} onSubmit={() => setOpen(false)}>
        <label className="sr-only" htmlFor="store-search">Buscar productos</label>
        <input
          id="store-search"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
            setResults([]);
            setTotal(0);
            setLoading(event.target.value.trim().length >= 2);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); setActive(-1); }
            if (event.key === "ArrowDown" && show && results.length) {
              event.preventDefault();
              setActive((value) => (value + 1) % results.length);
            }
            if (event.key === "ArrowUp" && show && results.length) {
              event.preventDefault();
              setActive((value) => (value <= 0 ? results.length - 1 : value - 1));
            }
            if (event.key === "Enter" && active >= 0 && results[active]) {
              event.preventDefault();
              router.push(`/productos/${results[active].categorySlug}/${results[active].slug}`);
              setOpen(false);
            }
          }}
          aria-controls="store-search-results"
          aria-activedescendant={active >= 0 && show ? `store-search-result-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="Buscá productos…"
          type="search"
          autoComplete="off"
        />
        <button type="submit" aria-label="Buscar productos"><Search size={19} aria-hidden="true" /></button>
      </Form>
      {show && (
        <div id="store-search-results" className={styles["search-results"]} role="listbox" aria-label="Sugerencias de productos">
          {loading ? <p className={styles["search-message"]}>Buscando productos…</p> : error ? (
            <p className={styles["search-message"]}>No pudimos cargar sugerencias. Podés buscar igual.</p>
          ) : results.length ? (
            <>
              <p className={styles["search-heading"]}>Productos encontrados</p>
              {results.map((product, index) => (
                <Link
                  id={`store-search-result-${index}`}
                  role="option"
                  aria-selected={active === index}
                  key={product.id}
                  href={`/productos/${product.categorySlug}/${product.slug}`}
                  className={styles["search-result"]}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles["search-thumb"]}>
                    {product.imageUrl ? <Image src={product.imageUrl} alt="" width={56} height={56} unoptimized /> : <Search size={20} aria-hidden="true" />}
                  </span>
                  <span className={styles["search-result-copy"]}>
                    <strong>{product.name}</strong>
                    <small>{product.categoryName}{product.imageIsReference ? " · Imagen de referencia" : ""}</small>
                  </span>
                  <span className={styles["search-price"]}>
                    {product.priceVisibility === "HIDDEN" || product.price == null
                      ? "Consultar precio"
                      : `${product.priceVisibility === "FROM" ? "Desde " : ""}${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(product.price)}`}
                  </span>
                </Link>
              ))}
              <Link href={searchHref} className={styles["search-all"]} onClick={() => setOpen(false)}>
                Ver {total} {total === 1 ? "resultado" : "resultados"} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          ) : <p className={styles["search-message"]}>No encontramos productos. Probá con otra medida o nombre.</p>}
        </div>
      )}
    </div>
  );
}
