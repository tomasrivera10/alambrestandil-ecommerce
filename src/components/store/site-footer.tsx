import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/content/site";
import { BrandLogo } from "./brand-logo";

const socialLinks = [
  { label: "Instagram", name: "instagram", href: site.instagramLink },
  { label: "Facebook", name: "facebook", href: site.facebookLink },
  { label: "WhatsApp", name: "whatsapp", href: site.whatsappLink },
];

export function SiteFooter() {
  return (
    <footer className="store-footer" data-store-section="contacto">
      <div className="store-container footer-top">
        <h2>Un buen cerco empieza con una buena charla.</h2>
        <Link href="/contacto" className="store-button button-light">
          Hablemos de tu proyecto <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="store-container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Alambres Tandil, inicio">
            <BrandLogo white />
          </Link>
          <p>
            La Casa del Alambrado en Tandil.
            <br />
            Todo para el alambrado y el alambrador.
          </p>
          <nav className="footer-socials" aria-label="Redes sociales">
            {socialLinks.map(({ label, name, href }) => (
              <a
                key={label}
                href={href}
                aria-label={`Alambres Tandil en ${label} (abre en una pestaña nueva)`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className={`footer-social-icon footer-social-icon-${name}`}
                  aria-hidden="true"
                />
              </a>
            ))}
          </nav>
          <div className="footer-contact">
            <a href="tel:+542494214973">
              <Phone size={16} aria-hidden="true" /> {site.phoneDisplay}
            </a>
            <a href={`mailto:${site.email}`}>
              <Mail size={16} aria-hidden="true" /> {site.email}
            </a>
          </div>
        </div>
        <div className="footer-navigation">
          <nav aria-label="Catálogo">
            <h3>Productos</h3>
            <Link href="/productos">Todos los productos</Link>
            <Link href="/productos/tejido-romboidal">Tejidos y mallas</Link>
            <Link href="/productos/postes-de-hormigon">Postes de hormigón</Link>
            <Link href="/productos/puertas-y-portones">Puertas y portones</Link>
            <Link href="/productos/accesorios-de-colocacion">Accesorios de colocación</Link>
          </nav>
          <nav aria-label="Ayuda y empresa">
            <h3>Te ayudamos</h3>
            <Link href="/calcular-alambrado">Calculá tu alambrado</Link>
            <Link href="/instalaciones">Pedí instalación</Link>
            <Link href="/nosotros">Conocenos</Link>
            <Link href="/pedido">Tu pedido</Link>
          </nav>
        </div>
        <div className="footer-location">
          <div className="footer-location-heading">
            <h3>Pasá por el local</h3>
            <a href={site.mapsLink} target="_blank" rel="noopener noreferrer">
              Cómo llegar <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          <p>
            <MapPin size={16} aria-hidden="true" /> {site.address}, Tandil
          </p>
          <p className="footer-address-detail">{site.addressDetail}</p>
          <iframe
            title="Ubicación de Alambres Tandil en Google Maps: Ijurco 1480, Tandil"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(site.mapsCoordinates)}&z=16&output=embed`}
            width="400"
            height="152"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
      <div className="store-container footer-bottom">
        <span>© {new Date().getFullYear()} Alambres Tandil</span>
        <span>Armá tu pedido online. Lo cerramos por WhatsApp.</span>
        <a href="https://www.romboidal.com.ar/" target="_blank" rel="noopener noreferrer">
          Trabajamos con Romboidal <ArrowUpRight size={12} aria-hidden="true" />
        </a>
        <Link href="/admin/login" className="footer-admin-link">
          <LockKeyhole size={14} aria-hidden="true" /> Administración
        </Link>
      </div>
    </footer>
  );
}
