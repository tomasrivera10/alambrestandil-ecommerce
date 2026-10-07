import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
export const metadata: Metadata = {
  title: "Productos",
  description:
    "Todo para el alambrado y el alambrador en Tandil: tejidos romboidales, postes, accesorios, puertas y portones galvanizados. Encontrá tu medida y armá el pedido.",
};
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogView query={await searchParams} />;
}
