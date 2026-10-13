"use client";
import { useState } from "react";
import { ActionForm } from "./action-form";
import { publishVariantPrice } from "@/server/pricing/actions";
import { grossMargin } from "@/features/pricing/calculation";
export function PriceConfirmation({
  variantId,
  supplierItemId,
  cost,
  currentPrice,
  suggested,
  targetMargin,
}: {
  variantId: string;
  supplierItemId: string;
  cost: number;
  currentPrice: number | null;
  suggested: number;
  targetMargin: number;
}) {
  const [raw, setRaw] = useState(suggested.toFixed(2).replace(".", ","));
  const value = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw.trim())
    ? Number(raw.replace(/\./g, "").replace(",", "."))
    : null;
  const margin = grossMargin(cost, value);
  return (
    <ActionForm
      action={publishVariantPrice}
      className="admin-inline-form"
      success="Precio de venta actualizado. El cambio quedó registrado."
    >
      <input hidden name="variantId" value={variantId} readOnly />
      <input hidden name="supplierItemId" value={supplierItemId} readOnly />
      <input hidden name="expectedCost" value={cost} readOnly />
      <input hidden name="expectedPrice" value={currentPrice ?? ""} readOnly />
      <label>
        Precio final (ARS)
        <input
          className="admin-input admin-money-input"
          name="price"
          inputMode="decimal"
          required
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </label>
      <p className={margin != null && margin < targetMargin - 0.01 ? "admin-notice" : "admin-help"}>
        {margin == null
          ? "Ingresá un precio válido para ver el margen."
          : `Margen con este precio: ${margin.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% · objetivo: ${targetMargin.toLocaleString("es-AR")}%${margin < targetMargin - 0.01 ? " · Queda por debajo del objetivo." : ""}`}
      </p>
      <label className="admin-check">
        <input key={raw} name="confirm" type="checkbox" required /> Confirmo el nuevo precio de esta
        medida
      </label>
      <button className="admin-button" disabled={value == null || value <= 0}>
        Actualizar precio de venta
      </button>
    </ActionForm>
  );
}
