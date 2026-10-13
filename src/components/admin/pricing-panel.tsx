import { PriceConfirmation } from "./price-confirmation";
import { marketConnected } from "@/server/pricing/token";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Search, TrendingUp } from "lucide-react";
import { pricingForVariant, familyObservedMargin } from "@/server/pricing/queries";
import { prisma } from "@/server/db";
import { ActionForm } from "./action-form";
import { PriceDisplay } from "./price-display";
import {
  saveMargin,
  clearVariantMargin,
  addMarketReference,
  verifyMarketReference,
  removeMarketReference,
  findMarketReferences,
} from "@/server/pricing/actions";

export async function PricingPanel({
  variantId,
  supplierItemId,
}: {
  variantId: string;
  supplierItemId?: string;
}) {
  const state = await pricingForVariant(variantId, supplierItemId);
  const family = await familyObservedMargin(state.variant.product.categoryId);
  const history = await prisma.priceChange.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const actors = history.length
    ? await prisma.user.findMany({
        where: { id: { in: history.map((change) => change.userId) } },
        select: { id: true, name: true },
      })
    : [];
  const pct = (n: number | null) =>
    n == null ? "Sin datos" : `${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
  return (
    <section className="admin-pricing-panel" aria-label={`Precios de ${state.variant.name}`}>
      <div className="admin-section-heading">
        <div>
          <h3>{state.variant.name}</h3>
          <p>
            {state.variant.product.name} · {state.variant.sku} ·{" "}
            {(state.variant.salesUnit ?? state.variant.product.salesUnit).toLowerCase()}
          </p>
        </div>
        <span className="admin-badge">
          <TrendingUp size={14} /> Guía de precio
        </span>
      </div>
      {state.linked.length > 1 && !state.selected && (
        <div className="admin-notice">
          <p>
            Elegí el proveedor del costo que querés usar. Cada presentación debe coincidir con la
            unidad de venta.
          </p>
          {state.linked.map((i) => (
            <Link
              className="admin-button-secondary"
              key={i.id}
              href={`/admin/proveedores/${i.supplierId}?articulo=${i.id}#item-${i.id}`}
            >
              {i.supplier.name}
            </Link>
          ))}
        </div>
      )}
      <div className="admin-prices-grid">
        <PriceDisplay
          kind="cost"
          label="Costo de compra"
          value={state.cost}
          note={
            state.selected
              ? `${state.selected.supplier.name} · importe literal de lista`
              : "Vinculá un costo del proveedor"
          }
        />
        <PriceDisplay
          kind="market"
          label="Referencia de mercado"
          emptyText="Sin referencia confiable"
          value={state.market.average}
          note={`${state.market.count} vendedores válidos · mínimo 3`}
        />
        <PriceDisplay
          kind="suggested"
          label="Precio sugerido"
          value={state.recommendation?.price ?? null}
          note={
            state.recommendation
              ? `${state.recommendation.costOnly ? "Basado solo en costo" : "Costo y mercado"} · objetivo ${pct(state.policy?.margin ?? null)}`
              : "Confirmá costo y margen objetivo"
          }
        />
        <PriceDisplay
          label={
            state.variant.product.priceVisibility === "HIDDEN"
              ? "Precio de venta actual"
              : "Precio publicado"
          }
          value={state.price}
          note={`${state.variant.product.priceVisibility === "HIDDEN" ? "En tienda: a consultar · " : ""}Margen observado: ${pct(state.observed)}`}
        />
      </div>
      <p className="admin-help">
        Margen bruto = (venta − costo) ÷ venta. No contempla otros gastos. Los importes se comparan
        tal como están publicados; verificá IVA, descuentos, envío y presentación.
      </p>
      {state.recommendation?.aboveMarket && (
        <p className="admin-notice">
          <AlertTriangle size={18} /> El precio necesario para tu margen supera el mercado. Revisá
          el costo y el objetivo antes de publicar.
        </p>
      )}
      <div className="admin-pricing-workspace">
        <div>
          <h4>Objetivo de margen</h4>
          <p className="admin-help">
            Actual: {pct(state.policy?.margin ?? null)}
            {state.policySource ? ` · ${state.policySource}` : ""}. La referencia observada de la
            familia es {pct(family.margin)} ({family.count} variantes con costo único).
          </p>
          <ActionForm action={saveMargin} className="admin-inline-form">
            <input type="hidden" name="variantId" value={variantId} />
            <label>
              Margen bruto (%)
              <input
                className="admin-input"
                name="margin"
                type="number"
                min="0"
                max="99"
                step="0.1"
                required
                defaultValue={
                  state.policy?.margin ??
                  (state.observed != null && state.observed >= 0 && state.observed < 100
                    ? Number(state.observed.toFixed(1))
                    : family.margin == null
                      ? ""
                      : Number(family.margin.toFixed(1)))
                }
              />
            </label>
            <label>
              Aplicar a
              <select className="admin-input" name="scope" defaultValue="variant">
                <option value="variant">Solo esta medida</option>
                <option value="category">Familia: {state.variant.product.category.name}</option>
              </select>
            </label>
            <button className="admin-button-secondary">Confirmar objetivo</button>
          </ActionForm>
          {state.policySource === "Variante" && (
            <ActionForm action={clearVariantMargin}>
              <input hidden name="variantId" value={variantId} readOnly />
              <button className="admin-text-button">Usar objetivo de la familia</button>
            </ActionForm>
          )}
        </div>
        <div>
          <h4>Confirmar precio de venta</h4>
          <p className="admin-help">
            El precio de esta medida se actualiza únicamente cuando lo confirmás.
          </p>
          {state.recommendation && state.selected ? (
            <PriceConfirmation
              key={`${state.price}-${state.cost}-${state.recommendation.price}`}
              variantId={variantId}
              supplierItemId={state.selected.id}
              cost={state.cost!}
              currentPrice={state.price}
              suggested={state.recommendation.price}
              targetMargin={state.policy!.margin}
            />
          ) : (
            <p className="admin-empty-inline">
              Falta un costo vinculado o un objetivo de margen confirmado.
            </p>
          )}
        </div>
      </div>
      <details className="admin-disclosure">
        <summary>
          Publicaciones de mercado y coincidencias ({state.variant.marketListings.length})
        </summary>
        <p className="admin-help">
          Aceptá solo el mismo producto, marca, material, medidas y presentación. La referencia usa
          al menos 3 vendedores distintos, sin valores extremos, consultados en las últimas 36
          horas.
        </p>
        {!marketConnected() && (
          <p className="admin-notice">
            Mercado Libre está pendiente de conexión. La búsqueda automática se habilita al conectar
            la fuente.
          </p>
        )}
        <div className="admin-inline-form">
          <ActionForm action={findMarketReferences}>
            <input hidden name="variantId" value={variantId} readOnly />
            <button disabled={!marketConnected()} className="admin-button-secondary">
              <Search size={16} /> Buscar en Mercado Libre
            </button>
          </ActionForm>
        </div>
        <ActionForm action={addMarketReference} className="admin-inline-form">
          <input hidden name="variantId" value={variantId} readOnly />
          <label className="grow">
            Enlace de publicación exacta
            <input className="admin-input" name="url" type="url" placeholder="https://…" required />
          </label>
          <button className="admin-button-secondary">Agregar publicación</button>
        </ActionForm>
        <div className="admin-reference-list">
          {state.variant.marketListings.map((row) => (
            <article key={row.id}>
              <div>
                <a href={row.url} target="_blank" rel="noreferrer">
                  {row.title} <ExternalLink size={14} />
                </a>
                <p className="admin-help">
                  {row.source} · {row.seller} ·{" "}
                  {row.refreshedAt
                    ? `Consultado ${row.refreshedAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`
                    : "Pendiente de consulta"}
                </p>
                {row.error && <p className="admin-error">{row.error}</p>}
              </div>
              <PriceDisplay kind="market" value={row.price == null ? null : Number(row.price)} />
              <div>
                {row.verifiedAt && !row.error && row.identity === state.identity ? (
                  <span className="admin-badge">
                    <CheckCircle2 size={14} /> Coincidencia confirmada
                  </span>
                ) : (
                  <ActionForm action={verifyMarketReference}>
                    <input hidden name="id" value={row.id} readOnly />
                    <label className="admin-check">
                      <input type="checkbox" name="exact" required /> Mismo producto y presentación
                    </label>
                    <button className="admin-button-secondary">Aceptar coincidencia</button>
                  </ActionForm>
                )}
                <ActionForm action={removeMarketReference}>
                  <input hidden name="id" value={row.id} readOnly />
                  <button className="admin-text-button">Quitar referencia</button>
                </ActionForm>
              </div>
            </article>
          ))}
        </div>
      </details>
      {!!history.length && (
        <details className="admin-disclosure">
          <summary>Historial de cambios de precio</summary>
          <ul className="admin-history">
            {history.map((change) => (
              <li key={change.id}>
                <span>
                  {change.createdAt.toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </span>
                <PriceDisplay value={Number(change.newPrice)} />
                <span>
                  Por{" "}
                  {actors.find((actor) => actor.id === change.userId)?.name ?? "Usuario registrado"}{" "}
                  · Margen: {pct(change.margin)} · costo registrado:{" "}
                  {Number(change.cost).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
