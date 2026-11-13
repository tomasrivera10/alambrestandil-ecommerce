"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

const slides = [
  {
    title: "Tu próximo proyecto empieza acá",
    category: "postes",
    detail: "Eucalipto, quebracho y hormigón.",
    href: "/productos/postes-de-hormigon",
    action: "Ver postes",
    src: "/images/campanas/postes-tejido-rojo-v1.png",
    alt: "Composición publicitaria generada con IA de postes y tejido romboidal",
  },
  {
    title: "Clavos para cada trabajo",
    category: "clavos",
    detail: "Medidas y presentaciones para obra, madera y techos.",
    href: "/productos/clavos",
    action: "Ver clavos",
    src: "/images/campanas/clavos-madera-carbon-v2.png",
    alt: "Composición publicitaria generada con IA de clavos punta París, cabeza chata, cabeza perdida, espiralado, cajonero y cabeza de plomo sobre madera",
  },
];

export function HomePromoCarousel({ discounts }: { discounts: Record<string, number> }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [paused, reducedMotion]);

  const select = (index: number) => setActive((index + slides.length) % slides.length);

  return (
    <div
      className="home-promo"
      aria-label="Selecciones de productos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="home-promo-stage">
        {slides.map((slide, index) => (
          <div className={`home-promo-slide${active === index ? " is-active" : ""}`} key={slide.href} aria-hidden={active !== index} inert={active !== index}>
            <div className="home-promo-photo">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 320px) 576px, (max-width: 600px) 180vw, (max-width: 1100px) 1080px, (max-width: 2172px) 100vw, 2172px"
                quality={95}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            </div>
            <div className="home-promo-copy">
              <h2>{slide.title}</h2>
              {discounts[slide.category] > 0 && (
                <div className="home-promo-offer"><span>HASTA</span><strong>{discounts[slide.category]}<span>%</span><em>OFF</em></strong><small>En productos seleccionados</small></div>
              )}
              <p>{slide.detail}</p>
              <Link href={slide.href} className="store-button">{slide.action} <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        ))}
        <button type="button" className="home-promo-arrow home-promo-prev" aria-label="Promoción anterior" onClick={() => select(active - 1)}><ArrowLeft size={20} aria-hidden="true" /></button>
        <button type="button" className="home-promo-arrow home-promo-next" aria-label="Promoción siguiente" onClick={() => select(active + 1)}><ArrowRight size={20} aria-hidden="true" /></button>
        <div className="home-promo-dots" aria-label="Elegir selección">
          {slides.map((slide, index) => <button type="button" key={slide.href} className={active === index ? "is-active" : ""} aria-label={slide.action} aria-current={active === index ? "true" : undefined} onClick={() => select(index)} />)}
        </div>
      </div>
    </div>
  );
}
