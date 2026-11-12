import "server-only";
import { marketToken, marketConnected } from "./token";
import { prisma } from "@/server/db";
import { literalSearch, retailHosts, searchHosts, searchRetail } from "./search";
import { variantIdentity } from "@/features/pricing/calculation";

const allowedHosts = () =>
  (process.env.MARKET_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
export function validateMarketUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443"))
    throw new Error("Usá una URL HTTPS del producto.");
  const ml = /^(?:www\.)?(?:mercadolibre\.com\.ar|articulo\.mercadolibre\.com\.ar)$/.test(
    url.hostname,
  );
  if (!ml && ![...retailHosts, ...allowedHosts()].includes(url.hostname.toLowerCase()))
    throw new Error("Esta tienda todavía no está habilitada como fuente de mercado.");
  return { url: url.toString(), ml };
}
async function readJson(url: string) {
  const token = await marketToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Mercado Libre no respondió (${response.status}). Revisá la conexión de la fuente.`,
    );
  return response.json();
}
function findProduct(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    record["@type"] === "Product" ||
    (Array.isArray(record["@type"]) && record["@type"].includes("Product"))
  )
    return record;
  return findProduct(record["@graph"]);
}
export async function fetchMarketListing(rawUrl: string) {
  const checked = validateMarketUrl(rawUrl);
  if (checked.ml) {
    const externalId = checked.url.match(/MLA[-]?(\d+)/i)?.[1];
    if (!externalId)
      throw new Error("Pegá el enlace de una publicación específica de Mercado Libre.");
    const id = `MLA${externalId}`;
    const item = await readJson(`https://api.mercadolibre.com/items/${id}`);
    if (item.status !== "active" || item.condition !== "new" || item.currency_id !== "ARS")
      throw new Error("La publicación debe estar activa, ser nueva y estar en pesos argentinos.");
    if (typeof item.title !== "string" || !item.seller_id)
      throw new Error("La publicación no permite verificar producto y vendedor.");
    if (item.variations?.length > 1)
      throw new Error(
        "La publicación reúne varias medidas. Elegí una publicación con una única presentación.",
      );
    const sourceIdentity = JSON.stringify({
      title: item.title,
      seller: item.seller_id,
      attributes: item.attributes,
      variations: item.variations,
      unit: item.sale_terms?.filter((term: { id: string }) => term.id.includes("UNIT")),
    });
    const sale = await readJson(`https://api.mercadolibre.com/items/${id}/sale_price`);
    const price = Number(sale.amount);
    if (!Number.isFinite(price) || price <= 0 || price > 9999999999.99)
      throw new Error("La fuente no devolvió un precio válido.");
    return {
      price,
      title: String(item.title),
      seller: `ML-${item.seller_id}`,
      source: "Mercado Libre",
      externalId: id,
      sourceIdentity,
      currency: "ARS",
    };
  }
  const response = await fetch(checked.url, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
    redirect: "error",
    headers: { Accept: "text/html" },
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html"))
    throw new Error("No se pudo leer la página de la tienda.");
  // Cap the body, including chunked responses, instead of trusting Content-Length.
  const reader = response.body?.getReader();
  if (!reader) throw new Error("La tienda devolvió una página vacía.");
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2_000_000) throw new Error("La página supera el tamaño permitido.");
      html += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel();
  }
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    let product: Record<string, unknown> | null = null;
    try {
      product = findProduct(JSON.parse(match[1]));
    } catch {
      continue;
    }
    if (!product) continue;
    const offers = product.offers;
    if (!offers || typeof offers !== "object" || Array.isArray(offers)) continue;
    const offer = offers as Record<string, unknown>;
    // AggregateOffers, bundles and variant ranges are intentionally not interpreted as one exact price.
    if (
      offer["@type"] !== "Offer" ||
      !String(offer.availability).endsWith("/InStock") ||
      offer.priceCurrency !== "ARS"
    )
      continue;
    const price = Number(offer.price);
    if (
      price > 0 &&
      Number.isFinite(price) &&
      price <= 9999999999.99 &&
      typeof product.name === "string"
    )
      return {
        price,
        title: product.name,
        seller: new URL(checked.url).hostname,
        source: new URL(checked.url).hostname,
        externalId: null,
        sourceIdentity: JSON.stringify({
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          gtin: product.gtin,
          unit: product.unitCode,
        }),
        currency: "ARS",
      };
  }
  throw new Error("Esta página no ofrece un precio único, disponible y verificable en ARS.");
}
export async function discoverMarket(variantId: string, supplierItemId?: string) {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: true, supplierItems: { include: { supplier: true } } },
  });
  const items = variant.supplierItems.filter((item) => item.purchased);
  const selected = supplierItemId
    ? items.find((item) => item.id === supplierItemId)
    : items.length === 1
      ? items[0]
      : null;
  if (!selected) throw new Error("Elegí el artículo del proveedor para buscar su nombre literal.");
  const context = literalSearch(selected);
  let found = 0;
  const errors: string[] = [];
  const urls = new Set<string>();
  const results = await Promise.allSettled(
    searchHosts.map(async (host) => ({ host, urls: await searchRetail(context.query, host) })),
  );
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      result.value.urls.forEach((url) => urls.add(url));
      if (!result.value.urls.length)
        errors.push(`${result.value.host}: sin coincidencias para el nombre literal.`);
    } else
      errors.push(
        `${searchHosts[index]}: ${result.reason instanceof Error ? result.reason.message : "No se pudo buscar."}`,
      );
  });
  if (marketConnected()) {
    try {
      const data = await readJson(
        `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(context.query)}&limit=10`,
      );
      for (const item of data.results ?? [])
        if (item.condition === "new" && item.permalink)
          urls.add(validateMarketUrl(item.permalink).url);
    } catch (error) {
      errors.push(
        `Mercado Libre API: ${error instanceof Error ? error.message : "Consulta fallida."}`,
      );
    }
  }
  // Read prices from the product page, never from search snippets.
  for (const url of [...urls].slice(0, 12)) {
    try {
      const existing = await prisma.marketListing.findUnique({ where: { url } });
      if (existing) continue;
      const data = await fetchMarketListing(url);
      await prisma.marketListing.create({
        data: {
          variantId,
          url,
          ...data,
          identity: variantIdentity(variant),
          refreshedAt: new Date(),
        },
      });
      found++;
    } catch (error) {
      errors.push(
        `${new URL(url).hostname}: ${error instanceof Error ? error.message : "No se pudo leer el precio."}`,
      );
    }
  }
  return { found, errors, context };
}
export async function refreshMarketReferences() {
  const total = await prisma.marketListing.count({ where: { verifiedAt: { not: null } } });
  const rows = await prisma.marketListing.findMany({
    where: { verifiedAt: { not: null } },
    include: { variant: { include: { product: true } } },
    orderBy: { refreshedAt: { sort: "asc", nulls: "first" } },
    take: 500,
  });
  let refreshed = 0,
    failed = 0;
  const started = Date.now();
  for (let offset = 0; offset < rows.length && Date.now() - started < 45000; offset += 10) {
    await Promise.all(
      rows.slice(offset, offset + 10).map(async (row) => {
        try {
          const identity = variantIdentity(row.variant);
          if (identity !== row.identity) {
            await prisma.marketListing.update({
              where: { id: row.id },
              data: { verifiedAt: null, error: "La variante cambió. Revisá la coincidencia." },
            });
            failed++;
            return;
          }
          const data = await fetchMarketListing(row.url);
          const changed =
            data.title !== row.title ||
            data.seller !== row.seller ||
            (row.sourceIdentity != null && data.sourceIdentity !== row.sourceIdentity);
          await prisma.marketListing.update({
            where: { id: row.id },
            data: {
              ...data,
              refreshedAt: new Date(),
              error: changed ? "La publicación cambió. Confirmá nuevamente la coincidencia." : null,
              ...(changed ? { verifiedAt: null } : {}),
            },
          });
          refreshed++;
        } catch (error) {
          await prisma.marketListing.update({
            where: { id: row.id },
            data: {
              refreshedAt: new Date(),
              error: error instanceof Error ? error.message : "No se pudo consultar la fuente.",
            },
          });
          failed++;
        }
      }),
    );
  }
  const result = {
    refreshed,
    failed,
    pending: Math.max(0, total - refreshed),
    date: new Date().toISOString(),
  };
  // Failures remain eligible for the next run; each attempt records its date and error.
  result.pending = Math.max(0, result.pending - failed);
  await prisma.siteSetting.upsert({
    where: { key: "market.lastRun" },
    create: { key: "market.lastRun", value: JSON.stringify(result) },
    update: { value: JSON.stringify(result) },
  });
  return result;
}
