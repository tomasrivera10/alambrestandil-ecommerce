import { formatMoney } from "@/lib/format";

export function PriceTag({
  visibility,
  price,
}: {
  visibility: "PUBLIC" | "HIDDEN" | "FROM" | string;
  price: number | null;
}) {
  if (visibility === "HIDDEN" || price == null) {
    return <span className="text-sm text-foreground">Consultar precio</span>;
  }
  const formatted = formatMoney(price);
  if (visibility === "FROM") {
    return (
      <span className="font-mono text-sm tabular-nums">
        Desde {formatted}
      </span>
    );
  }
  return <span className="font-mono text-sm tabular-nums">{formatted}</span>;
}
