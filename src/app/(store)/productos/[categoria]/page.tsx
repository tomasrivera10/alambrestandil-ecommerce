import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/features/products/queries";
import { CatalogView } from "@/components/store/catalog-view";
type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).categoria);
  return {
    title: category?.name ?? "Categoría",
    description: category?.description ?? "Materiales de Alambres Tandil.",
  };
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategory((await params).categoria);
  if (!category) notFound();
  return <CatalogView query={await searchParams} category={category} />;
}
