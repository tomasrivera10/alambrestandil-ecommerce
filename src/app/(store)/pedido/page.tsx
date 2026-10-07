import type { Metadata } from "next";
import { ServicePage } from "@/components/store/service-page";
import { CheckoutForm } from "@/components/store/checkout-form";
export const metadata: Metadata = { title: "Tu pedido" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Tu pedido"
      title="Un paso más. Lo cerramos juntos."
      intro="Dejanos tus datos y la forma de entrega. Guardamos tu pedido y seguimos por WhatsApp para confirmar disponibilidad, precio y coordinación."
    >
      <CheckoutForm />
    </ServicePage>
  );
}
