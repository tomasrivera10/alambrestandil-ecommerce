import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/store/empty-state";
import { PriceTag } from "@/components/store/price-tag";

export const metadata: Metadata = { title: "UI", robots: { index: false, follow: false } };

export default function UiLabPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="font-heading text-4xl">Laboratorio</h1>
      <div className="flex flex-wrap gap-3">
        <Button>Agregar al pedido</Button>
        <Button variant="outline">Consultar</Button>
        <Button variant="secondary">Secundario</Button>
      </div>
      <div className="flex gap-4">
        <PriceTag visibility="PUBLIC" price={18500} />
        <PriceTag visibility="FROM" price={24000} />
        <PriceTag visibility="HIDDEN" price={null} />
      </div>
      <div className="flex gap-2">
        <Badge>Activo</Badge>
        <Badge variant="outline">Consultar</Badge>
      </div>
      <Input aria-label="Ejemplo" placeholder="Altura" />
      <EmptyState title="Catálogo sin resultados" body="Probá otra medida o consultanos la que necesitás." />
    </main>
  );
}
