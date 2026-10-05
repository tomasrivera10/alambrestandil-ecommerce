import type { Metadata } from "next";
import Link from "next/link";
import { solutions } from "@/content/solutions";

export const metadata: Metadata = {
  title: "Soluciones",
  description: "Encontrá materiales según lo que querés cercar, no solo por el nombre técnico.",
};

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">¿No sabés qué necesitás?</h1>
      <p className="mt-3 text-sm">Contanos qué querés cercar y te mostramos los materiales habituales.</p>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {solutions.map((solution) => (
          <li key={solution.slug}>
            <Link href={`/soluciones/${solution.slug}`} className="block py-4">
              <span className="font-heading text-2xl">{solution.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{solution.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
