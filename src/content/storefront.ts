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
    detail: "El principio de un buen cerco.",
    ...categoryPhotos["tejido-romboidal"],
  },
  {
    slug: "postes-de-hormigon",
    name: "Postes",
    detail: "La base de tu proyecto.",
    ...categoryPhotos["postes-de-hormigon"],
  },
  {
    slug: "puertas-y-portones",
    name: "Portones",
    detail: "Dale entrada a tu espacio.",
    ...categoryPhotos["puertas-y-portones"],
  },
  {
    slug: "tejido-revestido",
    name: "Revestidos",
    detail: "Privacidad que se ve bien.",
    ...categoryPhotos["tejido-revestido"],
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
