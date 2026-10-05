import type { Metadata } from "next";
import { site } from "@/content/site";
import { whatsappUrl } from "@/features/whatsapp/message";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactPage() {
  const wa = whatsappUrl(site.phoneDigits, "Hola Alambres Tandil. Quiero hacer una consulta.");
  const map = `https://maps.google.com/?q=${encodeURIComponent(site.mapsQuery)}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-4xl">Contacto</h1>
      <dl className="mt-8 grid gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Local</dt>
          <dd>{site.address}. {site.addressDetail}.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd>{site.phoneDisplay}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Alambrados Neri</dt>
          <dd>{site.neriPhone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Correo</dt>
          <dd>{site.email}</dd>
        </div>
      </dl>
      <div className="mt-8 flex gap-4 text-sm">
        <a href={wa} className="underline">Escribir por WhatsApp</a>
        <a href={map} className="underline">Ver mapa</a>
      </div>
    </div>
  );
}
