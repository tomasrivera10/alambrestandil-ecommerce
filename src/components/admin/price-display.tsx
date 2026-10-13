const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export function PriceDisplay({
  value,
  kind = "published",
  label,
  note,
  emptyText = "Sin definir",
}: {
  value: number | null;
  kind?: "cost" | "market" | "suggested" | "published";
  label?: string;
  note?: string;
  emptyText?: string;
}) {
  return (
    <div className={`admin-price admin-price-${kind}`}>
      {label && <span className="admin-price-label">{label}</span>}
      <strong className={value == null ? "admin-price-empty" : undefined}>
        {value == null ? emptyText : formatter.format(value)}
      </strong>
      {note && <small>{note}</small>}
    </div>
  );
}
