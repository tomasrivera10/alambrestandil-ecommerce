import Link from "next/link";
import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl">{site.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Materiales para alambrados y cercos en Tandil. Armás el pedido y cerramos precio y
            disponibilidad por WhatsApp.
          </p>
        </div>
        <div className="text-sm">
          <p>{site.address}</p>
          <p>{site.addressDetail}</p>
          <p className="mt-2">{site.phoneDisplay}</p>
          <p>{site.email}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/instalaciones">Instalación</Link>
          <Link href="/pedido">Armar pedido</Link>
        </div>
      </div>
    </footer>
  );
}
