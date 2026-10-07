import type { Metadata } from "next";
import { ServicePage } from "@/components/store/service-page";
import { site } from "@/content/site";
export const metadata: Metadata = { title: "Contacto" };
export default function ContactPage() {
  return (
    <ServicePage
      eyebrow="Contacto"
      title="Acercate. Lo resolvemos juntos."
      intro="Traé las medidas, una idea o las dudas. Te ayudamos a elegir los materiales para avanzar."
      image="/images/tandil/materiales.webp"
    >
      <dl>
        <div>
          <dt>Visitá el local</dt>
          <dd>{site.address}, Tandil</dd>
          <span>{site.addressDetail}</span>
        </div>
        <div>
          <dt>Llamanos</dt>
          <dd>
            <a href="tel:+542494214973">{site.phoneDisplay}</a>
          </dd>
        </div>
        <div>
          <dt>Escribinos</dt>
          <dd>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <a
          className="store-button button-red"
          href={site.whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          Hablemos por WhatsApp
        </a>
        <a
          className="store-button button-outline"
          href={`https://maps.google.com/?q=${encodeURIComponent(site.mapsQuery)}`}
          target="_blank"
          rel="noreferrer"
        >
          Cómo llegar
        </a>
      </div>
    </ServicePage>
  );
}
