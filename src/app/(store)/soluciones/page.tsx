import type { Metadata } from "next";
import Link from "next/link";
import { solutions } from "@/content/solutions";
import { ServicePage } from "@/components/store/service-page";
export const metadata: Metadata = { title: "Soluciones" };
export default function SolutionsPage() {
  return (
    <ServicePage
      eyebrow="Soluciones"
      title="Cada espacio tiene su cerco."
      intro="Partí de lo que querés proteger. Encontrá los materiales habituales y consultanos por tu proyecto."
    >
      <div className="service-links">
        {solutions.map((solution) => (
          <Link key={solution.slug} href={`/soluciones/${solution.slug}`}>
            <h2>{solution.title} ↗</h2>
            <p>{solution.summary}</p>
          </Link>
        ))}
      </div>
    </ServicePage>
  );
}
