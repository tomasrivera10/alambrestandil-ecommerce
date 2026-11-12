import "server-only";

// Retail sources with catalogues relevant to fencing and wire products.
export const retailHosts = ["megaben.com.ar", "www.comercialcmp.com.ar"];
export const searchHosts = ["articulo.mercadolibre.com.ar", ...retailHosts];
export function literalSearch(item: {
  name: string;
  code: string;
  unit: string | null;
  supplier: { name: string };
}) {
  if (!item.name.trim()) throw new Error("El artículo del proveedor no tiene nombre.");
  return { query: item.name, supplier: item.supplier.name, code: item.code, unit: item.unit };
}
function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
export function searchLinks(xml: string, host: string) {
  const links = new Set<string>();
  for (const item of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const raw = item[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1];
    if (!raw) continue;
    try {
      const url = new URL(decodeXml(raw).trim());
      if (
        url.protocol === "https:" &&
        url.hostname === host &&
        !url.username &&
        !url.password &&
        !url.port
      ) {
        url.hash = "";
        links.add(url.toString());
      }
    } catch {
      /* Invalid search results are not sources. */
    }
  }
  return [...links].slice(0, 4);
}
export async function searchRetail(query: string, host: string) {
  if (!searchHosts.includes(host)) throw new Error("Fuente de búsqueda no habilitada.");
  if (host === "megaben.com.ar") {
    const response = await fetch("https://megaben.com.ar/sitemap-ecommerce-es-ar.xml", {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Catálogo Megaben no disponible (${response.status}).`);
    const xml = await response.text();
    if (xml.length > 2_000_000 || !/<urlset\b/i.test(xml))
      throw new Error("El catálogo no devolvió productos legibles.");
    return catalogueCandidates(xml, query);
  }
  const url = new URL("https://www.bing.com/search");
  url.searchParams.set("q", `site:${host} ${query}`);
  url.searchParams.set("format", "rss");
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Buscador no disponible (${response.status}).`);
  const xml = await response.text();
  if (xml.length > 2_000_000 || !/<rss\b/i.test(xml))
    throw new Error("El buscador no devolvió resultados legibles.");
  return searchLinks(xml, host);
}

export function catalogueCandidates(xml: string, query: string) {
  // These are candidates only: dimensions, brand and packaging still require confirmation.
  const words =
    query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z]{4,}/g) ?? [];
  const ranked = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].flatMap((match) => {
    try {
      const url = new URL(decodeXml(match[1]).trim());
      if (
        url.protocol !== "https:" ||
        url.hostname !== "megaben.com.ar" ||
        url.username ||
        url.password ||
        url.port
      )
        return [];
      const path = decodeURIComponent(url.pathname).toLowerCase();
      const score = words.filter((word) => path.includes(word)).length;
      return score >= Math.min(2, words.length) && score > 0
        ? [{ url: url.toString(), score }]
        : [];
    } catch {
      return [];
    }
  });
  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((row) => row.url);
}
