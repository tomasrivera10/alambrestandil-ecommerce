import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
export const metadata: Metadata = {
  title: "Productos",
  description:
    "Tejidos, postes, portones y materiales para cercos en Tandil. Encontrá tu medida y armá el pedido.",
};
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogView query={await searchParams} />;
}
