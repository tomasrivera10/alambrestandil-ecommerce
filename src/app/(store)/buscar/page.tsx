import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
export const metadata: Metadata = { title: "Buscar", robots: { index: false, follow: true } };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogView query={await searchParams} search />;
}
