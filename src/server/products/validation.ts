export function priceValue(raw?: string) {
  if (!raw?.trim()) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw.trim())) {
    throw new Error("Revisá el precio. Usá, por ejemplo, 12500,50; sin símbolo $.");
  }
  const value = Number(raw.trim().replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value) || value > 9999999999.99)
    throw new Error("El precio está fuera del rango permitido.");
  return value;
}
export function imageUrl(value: string) {
  if (/^\/(?!\/)[^\s]+$/.test(value)) return value;
  try {
    if (new URL(value).protocol === "https:") return value;
  } catch {}
  throw new Error("Usá una URL HTTPS válida o una ruta de imagen del sitio.");
}

export function sourceUrl(value?: string) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol)) return value;
  } catch {}
  throw new Error("La fuente o ficha técnica debe ser una dirección web HTTP o HTTPS.");
}
