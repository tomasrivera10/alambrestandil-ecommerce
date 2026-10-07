import Link from "next/link";
import { formatOrderNumber } from "@/lib/format";
import { OrderWhatsapp } from "@/components/store/order-whatsapp";
export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  const number = Number(n);
  return (
    <div className="store-container py-20">
      <span className="eyebrow">Gracias por elegirnos</span>
      <h1 className="mt-4">Tu pedido está registrado.</h1>
      <p className="my-6 max-w-xl">
        {n && Number.isFinite(number) ? `Pedido ${formatOrderNumber(number)}. ` : ""}Abrí WhatsApp
        para enviarnos el detalle y confirmar disponibilidad, precio y entrega con el equipo.
      </p>
      <div className="flex flex-wrap gap-4">
        <OrderWhatsapp />
        <Link href="/productos" className="store-button button-outline">
          Seguir mirando materiales
        </Link>
      </div>
    </div>
  );
}
