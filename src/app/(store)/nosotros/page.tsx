import type { Metadata } from "next";
import Link from "next/link";
import { ServicePage } from "@/components/store/service-page";
import { site } from "@/content/site";
export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "La Casa del Alambrado en Tandil. Continuamos el legado de Alambrados Neri SH, con más de dos décadas de trayectoria en el rubro.",
};
export default function AboutPage() {
  return (
    <ServicePage
      eyebrow="Nosotros"
      title="La Casa del Alambrado en Tandil."
      intro="Todo para el alambrado y el alambrador. Te ayudamos a elegir los materiales y acompañamos tu obra, desde el primer poste hasta el portón."
      image="/images/tandil/materiales.webp"
    >
      <h2>Un legado de más de dos décadas.</h2>
      <p>
        En Alambres Tandil continuamos el legado de Alambrados Neri SH, con más de dos décadas de
        trayectoria en el rubro. Trabajamos en toda la ciudad de Tandil, cerca de quienes necesitan
        cercar un terreno, una casa o un espacio de trabajo.
      </p>
      <p>
        Ofrecemos tejidos romboidales, accesorios, puertas y portones galvanizados, directo de
        fábrica. También encontrás postes, mallas y revestidos para completar tu alambrado.
      </p>
      <p>
        Atendemos a particulares, alambradores y profesionales de obra. Trabajamos con productos
        Romboidal y te asesoramos tanto si venís por los materiales como si necesitás la colocación.
      </p>
      <p>
        Encontranos en {site.address}, {site.addressDetail}.
      </p>
      <Link href="/contacto" className="store-button button-red mt-8">
        Vení a conocernos
      </Link>
    </ServicePage>
  );
}
