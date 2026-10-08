export const categoryPhotos: Record<string, { src: string; alt: string }> = {
  "tejido-romboidal": {
    src: "/images/referencias-productos/tejido-galvanizado.jpeg",
    alt: "Rollo de tejido romboidal galvanizado, imagen de referencia",
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
  "puertas-y-portones": {
    src: "/images/productos-transparentes/portones/porton-dos-hojas.webp",
    alt: "Portón galvanizado de dos hojas con tejido romboidal, visualización orientativa",
  },
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
    src: "/images/productos-transparentes/postes/poste-olimpico.png",
    alt: "Poste olímpico de hormigón, visualización orientativa",
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
    src: "/images/referencias-productos/torniquete-cambren.webp",
    alt: "Torniquete zincado, imagen de referencia de Cambren",
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
