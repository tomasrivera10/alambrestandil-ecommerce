import { requireArea } from "@/lib/rbac";
import { prisma, safeQuery } from "@/lib/db";
import { formatQuoteNumber } from "@/lib/format";

export default async function QuotesPage() {
  await requireArea("quotes");
  const quotes = await safeQuery(
    () => prisma.quote.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
    [],
  );
  return (
    <div>
      <h1 className="font-heading text-3xl">Cotizaciones</h1>
      {quotes.length === 0 ? <p className="mt-4 text-sm">Sin cotizaciones.</p> : null}
      <ul className="mt-4 divide-y divide-border text-sm">
        {quotes.map((quote) => (
          <li key={quote.id} className="py-3">
            <span className="font-mono">{formatQuoteNumber(quote.number)}</span> · {quote.name} · {quote.origin} · {quote.status}
            <span className="block text-muted-foreground">{quote.items.map((item) => item.name).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
