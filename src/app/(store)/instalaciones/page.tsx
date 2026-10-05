import type { Metadata } from "next";
import { InstallationForm } from "@/components/store/installation-form";

export const metadata: Metadata = {
  title: "Instalaciones",
  description: "Instalación de cercos perimetrales en Tandil y zona.",
};

export default function InstallationsPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h1 className="font-heading text-4xl">Necesito la obra completa</h1>
        <p className="mt-4 text-sm leading-relaxed">
          Colocamos cercos con postes de hormigón vibrado, tejido romboidal, revestido o PVC, y
          portones de caño. Contanos el terreno y te devolvemos un presupuesto.
        </p>
      </div>
      <InstallationForm />
    </div>
  );
}
