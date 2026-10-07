export const categoryPhotos: Record<string, { src: string; alt: string }> = {
  "tejido-romboidal": {
    src: "/images/tandil/tejido.webp",
    alt: "Cerco de tejido romboidal en Tandil",
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
    src: "/images/tandil/materiales.webp",
    alt: "Postes de hormigón en el depósito",
  },
  "puertas-y-portones": { src: "/images/tandil/portones.webp", alt: "Portón de caño y tejido" },
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
    src: "/images/catalogo/torniquetes.jpg",
    alt: "Torniquete: imagen de referencia de Alambre Pallás",
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
