import type { Metadata } from "next";
import { ServicePage } from "@/components/store/service-page";
import { InstallationForm } from "@/components/store/installation-form";
export const metadata: Metadata = { title: "Instalaciones" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Instalaciones"
      title="Tu cerco. De principio a fin."
      intro="Colocamos cercos perimetrales, postes y portones en Tandil y la zona. Contanos cómo es el terreno y armamos un presupuesto para tu obra."
    >
      <InstallationForm />
    </ServicePage>
  );
}
