"use client";
/* eslint-disable @next/next/no-img-element -- Supplier previews use catalogue image hosts. */
import { useId, useState } from "react";
import { Package, Search } from "lucide-react";
export type VariantOption = { id: string; name: string; unit: string; image?: string };
export function VariantSelect({
  options,
  defaultValue = "",
  label = "Medida de la tienda",
  name = "variantId",
}: {
  options: VariantOption[];
  defaultValue?: string;
  label?: string;
  name?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(defaultValue);
  const current = options.find((o) => o.id === selected);
  const normalized = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = options.filter(
    (o) => o.id === selected || normalized(o.name).includes(normalized(query)),
  );
  return (
    <div className="admin-variant-select">
      <label htmlFor={id}>{label}</label>
      <div className="admin-search-field">
        <Search size={16} />
        <input
          className="admin-input"
          aria-label={`Buscar opciones de ${label}`}
          placeholder="Buscá nombre, medida o código"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <select
        id={id}
        name={name}
        className="admin-input"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Pendiente de vincular</option>
        {visible.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} · {o.unit}
          </option>
        ))}
      </select>
      {!visible.length && <p className="admin-help">No hay medidas con esa búsqueda.</p>}
      {current && (
        <div className="admin-selected-variant">
          <div className="admin-product-thumb">
            {current.image ? <img src={current.image} alt="" /> : <Package size={20} />}
          </div>
          <p>
            {current.name}
            <small>{current.unit.toLowerCase()}</small>
          </p>
        </div>
      )}
    </div>
  );
}
