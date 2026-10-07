import type { Metadata } from "next";
import { ServicePage } from "@/components/store/service-page";
import { EstimateForm } from "@/components/store/estimate-form";
export const metadata: Metadata = { title: "Calculá tu alambrado" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Calculá tu alambrado"
      title="Poné tu proyecto en números."
      intro="Una primera estimación de materiales para avanzar. El equipo confirma medidas, cantidades y presupuesto antes de cerrar tu pedido."
    >
      <EstimateForm />
    </ServicePage>
  );
}
