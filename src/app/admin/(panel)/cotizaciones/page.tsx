import { StatusLabel, statusText } from "@/components/admin/status-label";
import { SectionNav } from "@/components/admin/section-nav";
import { requireArea } from "@/server/rbac";
import { prisma, safeQuery } from "@/server/db";
import { formatQuoteNumber } from "@/lib/format";

export default async function QuotesPage() {
  await requireArea("quotes");
  const quotes = await safeQuery(
    () => prisma.quote.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
    [],
  );
  return (
    <div className="admin-page">
      <SectionNav kind="orders" />
      <div className="admin-page-heading">
        <div>
          <h1>Presupuestos</h1>
          <p>Consultas de materiales e instalaciones para continuar la atención.</p>
        </div>
      </div>
      {quotes.length === 0 ? <p className="mt-4 text-sm">Sin cotizaciones.</p> : null}
      <ul className="mt-4 divide-y divide-border text-sm">
        {quotes.map((quote) => (
          <li key={quote.id} className="py-3">
            <span className="font-mono">{formatQuoteNumber(quote.number)}</span> · {quote.name} ·{" "}
            {statusText(quote.origin)} · <StatusLabel value={quote.status} />
            <span className="block text-muted-foreground">
              {quote.items.map((item) => item.name).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
