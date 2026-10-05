import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Nosotros" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-4xl">La Casa del Alambrado</h1>
      <p className="mt-6 text-sm leading-relaxed">
        Alambres Tandil vende y coloca materiales para cercos en Tandil. El local está en{" "}
        {site.address}, {site.addressDetail}. El proyecto arrancó en 2018 y se apoya en la
        trayectoria de Alambrados Neri.
      </p>
      <p className="mt-4 text-sm leading-relaxed">
        Trabajamos tejidos de Romboidal SA, fabricante con certificado INTI, y atendemos al
        particular, al alambrador, a la obra y al campo con el mismo mostrador: una lista clara y
        una conversación por WhatsApp.
      </p>
    </article>
  );
}
