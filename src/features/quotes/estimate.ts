export type EstimateInput = {
  terrain: string;
  meters: number;
  height: number;
  mesh: string;
  post: string;
  gate: string;
  install: boolean;
};

export type EstimateLine = {
  name: string;
  quantity: number;
  unit: "ROLLO" | "UNIDAD" | "JUEGO";
  note?: string;
};

const MESH_LABEL: Record<string, string> = {
  romboidal: "Tejido romboidal galvanizado",
  revestido: "Tejido revestido símil ligustrina",
  pvc: "Tejido PVC",
};

const POST_LABEL: Record<string, string> = {
  olimpico: "Poste olímpico de hormigón",
  recto: "Poste recto de hormigón",
};

export function estimateFence(input: EstimateInput): EstimateLine[] {
  const meters = Math.max(0, input.meters);
  const posts = Math.max(2, Math.ceil(meters / 2.5) + 1);
  const rolls = Math.max(1, Math.ceil(meters / 10));
  const tensionRolls = Math.max(1, Math.ceil((meters * (input.height > 1.5 ? 2 : 1)) / 100));
  const lines: EstimateLine[] = [
    {
      name: `${MESH_LABEL[input.mesh] ?? "Tejido"} ${input.height.toFixed(2).replace(".", ",")} m`,
      quantity: rolls,
      unit: "ROLLO",
      note: "Rollo de referencia de 10 m. El largo real se confirma en el local.",
    },
    {
      name: POST_LABEL[input.post] ?? "Poste de hormigón",
      quantity: posts,
      unit: "UNIDAD",
      note: "Separación estimada de 2,50 m.",
    },
    {
      name: "Alambre tensor galvanizado",
      quantity: tensionRolls,
      unit: "ROLLO",
    },
    {
      name: "Torniquetes y ganchos",
      quantity: posts,
      unit: "JUEGO",
    },
  ];

  if (input.gate !== "ninguno") {
    lines.push({
      name: input.gate === "reforzado" ? "Portón reforzado" : "Portón línea económica",
      quantity: 1,
      unit: "UNIDAD",
    });
  }

  if (input.install) {
    lines.push({
      name: "Instalación de cerco",
      quantity: 1,
      unit: "JUEGO",
      note: "La mano de obra se cotiza después de ver el terreno.",
    });
  }

  return lines;
}

export const ESTIMATE_DISCLAIMER =
  "Esta lista es una estimación para conversar. No reemplaza una medición ni un presupuesto cerrado.";
