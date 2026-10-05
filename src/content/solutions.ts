export type Solution = {
  slug: string;
  title: string;
  summary: string;
  categories: string[];
  prompt: string;
};

export const solutions: Solution[] = [
  {
    slug: "cerrar-un-terreno",
    title: "Cerrar un terreno",
    summary: "Tejido, postes y portón para un lote urbano.",
    categories: ["tejido-romboidal", "postes-de-hormigon", "puertas-y-portones"],
    prompt: "Quiero cerrar un terreno.",
  },
  {
    slug: "cercar-una-casa",
    title: "Cercar una casa",
    summary: "Perímetro de vivienda, con opción de tejido revestido.",
    categories: ["tejido-revestido", "tejido-romboidal", "postes-de-hormigon"],
    prompt: "Quiero cercar una casa.",
  },
  {
    slug: "cerrar-un-campo",
    title: "Cerrar un campo",
    summary: "Alambre, púas y postes para uso rural.",
    categories: ["alambre-de-puas", "postes-de-hormigon", "tejido-romboidal"],
    prompt: "Quiero cerrar un campo.",
  },
  {
    slug: "cercar-una-pileta",
    title: "Cercar una pileta",
    summary: "Cierre más cerrado, con malla chica o revestido.",
    categories: ["tejido-revestido", "tejido-pvc", "puertas-y-portones"],
    prompt: "Quiero cercar una pileta.",
  },
  {
    slug: "mejorar-la-seguridad",
    title: "Mejorar la seguridad",
    summary: "Concertina, púas y pinches para un cerco existente.",
    categories: ["concertinas", "alambre-de-puas"],
    prompt: "Quiero mejorar la seguridad del cerco.",
  },
  {
    slug: "cercar-una-cancha",
    title: "Cercar una cancha",
    summary: "Tejido de mayor altura y malla para deporte.",
    categories: ["tejido-pvc", "tejido-romboidal", "postes-de-hormigon"],
    prompt: "Quiero cercar una cancha.",
  },
  {
    slug: "construir-un-porton",
    title: "Construir un portón",
    summary: "Portón de caño, liviano o reforzado.",
    categories: ["puertas-y-portones"],
    prompt: "Quiero un portón.",
  },
  {
    slug: "comprar-materiales",
    title: "Llevar materiales",
    summary: "Si ya sabés medidas, armá el pedido directo.",
    categories: ["tejido-romboidal", "postes-de-hormigon", "clavos"],
    prompt: "Quiero comprar materiales.",
  },
  {
    slug: "pedir-instalacion",
    title: "Pedir instalación",
    summary: "Obra completa: materiales y colocación.",
    categories: ["tejido-romboidal", "postes-de-hormigon"],
    prompt: "Necesito la obra completa.",
  },
];

export function getSolution(slug: string) {
  return solutions.find((item) => item.slug === slug) ?? null;
}
