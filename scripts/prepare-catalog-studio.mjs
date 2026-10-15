import sharp from "sharp";
import { readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const output = "public/images/catalogo-estudio";
const official = "https://www.romboidal.com.ar/";
const nails = "https://www.gerdau.com.ar/node/331";
const reference = " Visualización de referencia generada con IA; medidas y detalles pueden variar.";
const definitions = {
  "tejido-romboidal": [
    "tejido-romboidal-v2.png",
    "Rollo de tejido romboidal galvanizado parcialmente desplegado.",
    official,
  ],
  "alambre-boyero": ["alambre-boyero.png", "Rollo de alambre boyero galvanizado.", null],
  "alambre-alta-resistencia": [
    "alambre-alta-resistencia.png",
    "Rollo de alambre liso galvanizado de alta resistencia.",
    official,
  ],
  "alambre-de-fardo": ["alambre-de-fardo.png", "Rollo de alambre recocido para fardos.", null],
  "alambre-galvanizado": [
    "alambre-galvanizado.png",
    "Rollo de alambre liso galvanizado.",
    official,
  ],
  "torniquete-zincado": ["torniquete-zincado.png", "Torniquete zincado para tensar alambre.", null],
  "torniquete-doble": [
    "torniquete-doble.png",
    "Torniquete doble zincado para alambrado.",
    "https://www.mla.com.ar/torniquete-doble-y-doble-reforzado/",
  ],
  "gancho-j": [
    "gancho-j.png",
    "Gancho tensor J roscado con tuercas.",
    "https://www.gramtor.com/producto.html?productId=32",
  ],
  "planchuela-zincada": [
    "planchuela-zincada.png",
    "Planchuelas rectas zincadas para tensar tejido.",
    null,
  ],
  "soporte-concertina-y": [
    "soporte-concertina-y.png",
    "Soporte de acero para concertina en Y.",
    null,
  ],
  "pinche-medianera": [
    "pinche-medianera.png",
    "Tira de pinches de seguridad para medianera de cinco puntas.",
    null,
  ],
  "palomita-j": ["palomita-j.png", "Palomita J curva de planchuela galvanizada.", null],
  "palomita-z": ["palomita-z.png", "Palomita Z de planchuela galvanizada.", null],
  "concertina-simple": [
    "concertina-simple.png",
    "Concertina simple de 300 mm, SKU AT-XLS-033.",
    official,
  ],
  "concertina-cruzada": [
    "concertina-cruzada.png",
    "Concertina cruzada de 450 mm, SKU AT-XLS-034.",
    official,
  ],
  "clavo-cabeza-chata": [
    "clavo-cabeza-chata.png",
    "Clavos de acero de cabeza chata y vástago liso.",
    nails,
  ],
  "clavo-cabeza-perdida": ["clavo-cabeza-perdida.png", "Clavos de acero de cabeza perdida.", nails],
  "clavo-espiralado": ["clavo-espiralado.png", "Clavos de acero de vástago espiralado.", nails],
  "clavo-cajonero": ["clavo-cajonero.png", "Clavos punta cajonero de acero.", nails],
  "clavo-cabeza-plomo": [
    "clavo-cabeza-plomo.png",
    "Clavos dentados para techo con cabeza de plomo.",
    nails,
  ],
  "clavo-punta-paris-acerbrag": [
    "clavo-punta-paris-acerbrag.png",
    "Clavos punta París de acero, familia Acerbrag.",
    "https://acerbrag.com/imgs/brochure_productos.pdf",
  ],
  "clavo-punta-paris-acindar": [
    "clavo-punta-paris-acindar.png",
    "Clavos punta París de acero, familia Acindar.",
    "https://www.acindar.com.ar/",
  ],
  "clavo-punta-paris": [
    "../productos-generados/clavos-paris.png",
    "Clavos punta París de acero.",
    null,
  ],
  "alambre-de-puas": [
    "../productos-generados/alambre-puas.png",
    "Rollo de alambre galvanizado de púas.",
    official,
  ],
  "poste-recto": [
    "../productos-transparentes/postes/poste-recto.png",
    "Poste de hormigón recto.",
    official,
  ],
  "poste-olimpico": [
    "../productos-transparentes/postes/poste-olimpico.png",
    "Poste olímpico de hormigón con codo.",
    official,
  ],
  puntal: [
    "../productos-transparentes/postes/puntal.png",
    "Puntal de hormigón para cerco.",
    official,
  ],
  "puerta-peatonal": [
    "../productos-transparentes/portones/puerta-peatonal.png",
    "Puerta peatonal galvanizada con tejido romboidal.",
    null,
  ],
  "porton-dos-hojas": [
    "../productos-transparentes/portones/porton-dos-hojas.png",
    "Portón galvanizado de dos hojas con tejido romboidal.",
    null,
  ],
};
const products = {
  "tejido-romboidal-galvanizado": ["tejido-romboidal"],
  "alambre-boyero": ["alambre-boyero"],
  "alambre-alta-resistencia": ["alambre-alta-resistencia"],
  "alambre-de-fardo": ["alambre-de-fardo"],
  "alambre-galvanizado": ["alambre-galvanizado"],
  "alambre-de-puas": ["alambre-de-puas"],
  "torniquete-zincado": ["torniquete-zincado"],
  "torniquete-doble": ["torniquete-doble"],
  "gancho-j": ["gancho-j"],
  "planchuela-zincada": ["planchuela-zincada"],
  "soporte-concertina-y": ["soporte-concertina-y"],
  "pinche-medianera": ["pinche-medianera"],
  "palomita-j": ["palomita-j"],
  "palomita-z": ["palomita-z"],
  "concertina-de-seguridad": ["concertina-simple", "concertina-cruzada"],
  "clavo-cabeza-chata": ["clavo-cabeza-chata"],
  "clavo-cabeza-chata-gerdau": ["clavo-cabeza-chata"],
  "clavo-cabeza-chata-otras": ["clavo-cabeza-chata"],
  "clavo-cabeza-perdida": ["clavo-cabeza-perdida"],
  "clavo-espiralado": ["clavo-espiralado"],
  "clavo-cajonero": ["clavo-cajonero"],
  "clavo-cabeza-plomo": ["clavo-cabeza-plomo"],
  "clavo-punta-paris": ["clavo-punta-paris"],
  "clavo-punta-paris-grande": ["clavo-punta-paris"],
  "clavo-punta-paris-acerbrag": ["clavo-punta-paris-acerbrag"],
  "clavo-punta-paris-acindar": ["clavo-punta-paris-acindar"],
  "poste-esquinero": ["poste-recto", "poste-olimpico"],
  "poste-intermedio": ["poste-recto", "poste-olimpico"],
  "poste-olimpico-con-codo": ["poste-olimpico"],
  puntal: ["puntal"],
  "puerta-para-cerco": ["puerta-peatonal"],
  "porton-para-cerco": ["porton-dos-hojas"],
};

let previous;
try {
  previous = JSON.parse(await readFile("src/content/catalog-studio.json", "utf8"));
} catch {
  /* First preparation. */
}
const assets = {};
for (const [key, [original, alt, sourceUrl]] of Object.entries(definitions)) {
  const source = path.join(root, output, original);
  const metadata = await sharp(source).metadata();
  if (Math.max(metadata.width ?? 0, metadata.height ?? 0) < 1200)
    throw new Error(`Resolución insuficiente: ${key}`);
  // Preserve native resolution: no enlargement or sharpening of invented detail.
  const target = `${output}/${key}.webp`;
  await sharp(source)
    .rotate()
    .flatten({ background: "#ffffff" })
    .webp({ quality: 92, effort: 6 })
    .toFile(target);
  const bytes = await readFile(target);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const localUrl = `/images/catalogo-estudio/${key}.webp`;
  assets[key] = {
    url: previous?.assets?.[key]?.sha256 === sha256 ? previous.assets[key].url : localUrl,
    localUrl,
    alt: alt + reference,
    sourceUrl,
    width: metadata.width,
    height: metadata.height,
    bytes: (await stat(target)).size,
    sha256,
  };
}
const catalog = JSON.parse(await readFile("prisma/catalog.json", "utf8"));
const missing = catalog.products.filter((p) => !products[p.slug]);
if (missing.length)
  throw new Error(`Familias sin imagen: ${missing.map((p) => p.slug).join(", ")}`);
await writeFile(
  "src/content/catalog-studio.json",
  JSON.stringify({ version: "catalog-studio-2026-10-15-v1", assets, products }, null, 2) + "\n",
);
console.log(
  `${Object.keys(assets).length} imágenes WebP; ${Object.keys(products).length} familias cubiertas; resolución nativa conservada.`,
);
