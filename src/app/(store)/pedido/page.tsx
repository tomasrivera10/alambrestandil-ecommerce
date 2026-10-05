import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Pedido",
  description: "Confirmá los datos del pedido y seguimos por WhatsApp.",
};

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-heading text-4xl">Armá el pedido</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        No hay pago online. Guardamos el pedido y te abrimos WhatsApp con el detalle.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
