import Link from "next/link";
import { formatOrderNumber } from "@/lib/format";

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  const number = Number(n);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-heading text-4xl">Pedido registrado</h1>
      <p className="mt-4 text-sm leading-relaxed">
        {Number.isFinite(number)
          ? `Quedó cargado como ${formatOrderNumber(number)}. Si WhatsApp no se abrió, volvé a intentar desde el chat del local.`
          : "El pedido quedó cargado."}
      </p>
      <Link href="/productos" className="mt-6 inline-block text-sm underline">
        Seguir mirando materiales
      </Link>
    </div>
  );
}
