import studio from "./catalog-studio.json";

function studioPhoto(key: keyof typeof studio.assets) {
  const image = studio.assets[key];
  return { src: image.localUrl, alt: image.alt };
}

export const categoryPhotos: Record<string, { src: string; alt: string }> = {
  "tejido-romboidal": {
    ...studioPhoto("tejido-romboidal"),
  },
  "tejido-revestido": {
    src: "/images/tandil/rombogreen.webp",
    alt: "Tejido revestido símil ligustrina",
  },
  "tejido-pvc": {
    src: "/images/romboidal/tejido-pvc.webp",
    alt: "Tejido PVC del fabricante Romboidal",
  },
  "malla-electrosoldada": {
    src: "/images/tandil/rollos.webp",
    alt: "Rollos de malla electrosoldada",
  },
  "postes-de-hormigon": {
    ...studioPhoto("poste-olimpico"),
  },
  "puertas-y-portones": {
    ...studioPhoto("porton-dos-hojas"),
  },
  "accesorios-de-colocacion": studioPhoto("torniquete-zincado"),
  "alambre-galvanizado": studioPhoto("alambre-galvanizado"),
  concertinas: studioPhoto("concertina-cruzada"),
  "alambre-de-puas": studioPhoto("alambre-de-puas"),
  clavos: studioPhoto("clavo-punta-paris"),
};
export const featuredCategories = [
  {
    slug: "tejido-romboidal",
    name: "Tejidos",
    detail: "Romboidales para tu alambrado.",
    ...categoryPhotos["tejido-romboidal"],
  },
  {
    slug: "postes-de-hormigon",
    name: "Postes",
    detail: "El sostén de tu alambrado.",
    ...categoryPhotos["postes-de-hormigon"],
  },
  {
    slug: "puertas-y-portones",
    name: "Portones",
    detail: "Puertas y portones galvanizados.",
    ...categoryPhotos["puertas-y-portones"],
  },
  {
    slug: "accesorios-de-colocacion",
    name: "Accesorios",
    detail: "Cada pieza para la colocación.",
    ...categoryPhotos["accesorios-de-colocacion"],
  },
];
export const filterLabels: Record<string, string> = {
  altura: "Altura",
  abertura: "Abertura",
  calibre: "Calibre",
  revestimiento: "Revestimiento",
  largo: "Largo",
  terminacion: "Terminación",
  seccion: "Sección",
  tipo: "Tipo",
  uso: "Uso",
  color: "Color",
  ancho: "Ancho",
  diametro: "Diámetro",
  medida: "Medida",
  presentacion: "Presentación",
};
