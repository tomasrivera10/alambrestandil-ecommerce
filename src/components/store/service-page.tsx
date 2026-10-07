import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
export function ServicePage({
  eyebrow,
  title,
  intro,
  image = "/images/tandil/tejido.webp",
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image?: string;
  children: ReactNode;
}) {
  return (
    <div className="store-container service-page">
      <nav className="breadcrumbs" aria-label="Ubicación">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>{eyebrow}</span>
      </nav>
      <div className="service-page-grid">
        <div className="service-page-intro">
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="service-page-photo">
            <Image
              src={image}
              alt="Materiales y cercos de Alambres Tandil"
              fill
              sizes="(max-width: 760px) 100vw, 45vw"
            />
          </div>
          <span className="service-caption">Alambres Tandil · Materiales y colocación</span>
        </div>
        <div className="service-page-body">{children}</div>
      </div>
    </div>
  );
}
