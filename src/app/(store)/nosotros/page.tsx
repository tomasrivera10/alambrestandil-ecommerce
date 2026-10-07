import type { Metadata } from "next";
import Link from "next/link";
import { ServicePage } from "@/components/store/service-page";
import { site } from "@/content/site";
export const metadata: Metadata = { title: "Nosotros" };
export default function AboutPage() {
  return (
    <ServicePage
      eyebrow="Nosotros"
      title="De Tandil. Para tus proyectos."
      intro="Somos La Casa del Alambrado. Materiales, experiencia y una conversación directa para encontrar el cerco que necesitás."
      image="/images/tandil/materiales.webp"
    >
      <h2>El trabajo se construye todos los días.</h2>
      <p>
        Alambres Tandil nació en 2018, con Mauro Broggia al frente y la trayectoria familiar de
        Alambrados Neri como punto de partida.
      </p>
      <p>
        Atendemos al particular, al alambrador, a la obra y al campo. Trabajamos con productos
        Romboidal y acompañamos cada proyecto, desde la elección de materiales hasta su colocación.
      </p>
      <p>
        Encontranos en {site.address}, {site.addressDetail}, Tandil.
      </p>
      <Link href="/contacto" className="store-button button-red mt-8">
        Vení a conocernos
      </Link>
    </ServicePage>
  );
}
