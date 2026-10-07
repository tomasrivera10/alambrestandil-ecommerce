import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { getSolution } from "@/content/solutions";
import { listProducts } from "@/features/products/queries";
import { site } from "@/content/site";
import { whatsappUrl } from "@/features/whatsapp/message";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);
  return { title: solution?.title ?? "Solución" };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution) notFound();
  const groups = await Promise.all(
    solution.categories.map(async (category) => ({
      category,
      products: await listProducts({ categorySlug: category }),
    })),
  );
  const wa = whatsappUrl(site.phoneDigits, `Hola Alambres Tandil. ${solution.prompt}`);

  return (
    <div className="store-container solution-detail py-12">
      <h1 className="font-heading text-4xl">{solution.title}</h1>
      <p className="mt-3 max-w-xl text-sm">{solution.summary}</p>
      <a href={wa} className="store-button button-red mt-6">
        Consultar esta obra
      </a>
      {groups.map((group) => (
        <section key={group.category} className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl">{group.category.replaceAll("-", " ")}</h2>
            <Link href={`/productos/${group.category}`} className="text-sm underline">
              Ver categoría
            </Link>
          </div>
          <div className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {group.products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
