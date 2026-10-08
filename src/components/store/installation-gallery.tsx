"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./installation-gallery.module.css";

const works = [
  {
    src: "/images/tandil/tejido.webp",
    alt: "Cerco romboidal de gran extensión con portón de dos hojas y postes alineados en un terreno parquizado",
    title: "Cerco perimetral y portón",
    source: "https://alambrestandil.com.ar/",
    sourceLabel: "Ver sitio de la empresa",
  },
  {
    src: "/images/hero/alambrado-tandil-editado.webp",
    alt: "Cerco romboidal extenso y prolijo sobre césped, con postes de hormigón y el cartel de Alambres Tandil visible",
    title: "Tejido romboidal · Alambres Tandil",
    source: "https://www.instagram.com/alambrestandil/",
    sourceLabel: "Ver en Instagram",
  },
];

export function InstallationGallery() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <section
      className={styles.gallery}
      aria-label="Trabajos realizados"
      aria-roledescription="carrusel"
    >
      <h2 className={styles.heading}>Trabajos realizados</h2>
      <div
        ref={track}
        className={styles.track}
        tabIndex={0}
        aria-label="Fotografías de instalaciones. Usá las flechas para navegar."
        onScroll={(event) => {
          const element = event.currentTarget;
          setActive(Math.round(element.scrollLeft / element.clientWidth));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(
              Math.max(
                0,
                Math.min(works.length - 1, active + (event.key === "ArrowRight" ? 1 : -1)),
              ),
            );
          }
        }}
      >
        {works.map((work, index) => (
          <div
            key={work.src}
            className={styles.slide}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${works.length}: ${work.title}`}
          >
            <Image
              src={work.src}
              alt={work.alt}
              fill
              preload={index === 0}
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1440px) 50vw, 700px"
            />
          </div>
        ))}
      </div>
      <div className={styles.caption} aria-live="polite" aria-atomic="true">
        <p>{works[active].title}</p>
        <span>
          {active + 1} / {works.length}
        </span>
      </div>
      <div className={styles.controls}>
        <a href={works[active].source} target="_blank" rel="noopener noreferrer">
          {works[active].sourceLabel} <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <div className={styles.buttons}>
          <button
            type="button"
            aria-label="Ver trabajo anterior"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Ver siguiente trabajo"
            disabled={active === works.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
