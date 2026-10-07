import Link from "next/link";
import { ArrowUpRight, Camera, MapPin, Phone } from "lucide-react";
import { site } from "@/content/site";
import { BrandLogo } from "./brand-logo";
export function SiteFooter() {
  return (
    <footer className="store-footer">
      <div className="store-container footer-top">
        <h2>
          Un buen cerco empieza
          <br />
          con una buena charla.
        </h2>
        <Link href="/contacto" className="store-button button-light">
          Hablemos de tu proyecto <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="store-container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Alambres Tandil, inicio">
            <BrandLogo white />
          </Link>
          <p>
            Materiales, asesoramiento e instalación.
            <br />
            Desde Tandil, para tu próximo proyecto.
          </p>
          <a
            href="https://www.instagram.com/alambrestandil/"
            target="_blank"
            rel="noreferrer"
            className="footer-social"
          >
            <Camera size={19} /> Seguinos en Instagram <ArrowUpRight size={15} />
          </a>
        </div>
        <nav aria-label="Catálogo y soluciones">
          <h3>Encontrá lo que necesitás</h3>
          <Link href="/productos">Todos los productos</Link>
          <Link href="/productos/tejido-romboidal">Tejidos y mallas</Link>
          <Link href="/productos/postes-de-hormigon">Postes de hormigón</Link>
          <Link href="/productos/puertas-y-portones">Puertas y portones</Link>
          <Link href="/productos?marca=Romboidal">Productos Romboidal</Link>
        </nav>
        <nav aria-label="Ayuda y empresa">
          <h3>Estamos para ayudarte</h3>
          <Link href="/calcular-alambrado">Calculá tu alambrado</Link>
          <Link href="/instalaciones">Pedí instalación</Link>
          <Link href="/soluciones">Soluciones para tu espacio</Link>
          <Link href="/nosotros">Conocenos</Link>
          <Link href="/pedido">Tu pedido</Link>
        </nav>
        <div className="footer-contact">
          <h3>Pasá por el local</h3>
          <p>
            <MapPin size={17} />
            {site.address}, Tandil
          </p>
          <span>{site.addressDetail}</span>
          <a href="tel:+542494214973">
            <Phone size={16} />
            {site.phoneDisplay}
          </a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <Link href="/contacto" className="text-link">
            Cómo llegar <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="store-container footer-bottom">
        <span>© {new Date().getFullYear()} Alambres Tandil</span>
        <span>Armá tu pedido online. Lo cerramos por WhatsApp.</span>
        <a href="https://www.romboidal.com.ar/" target="_blank" rel="noreferrer">
          Trabajamos con Romboidal <ArrowUpRight size={12} />
        </a>
      </div>
    </footer>
  );
}
