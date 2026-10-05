import type { Metadata } from "next";
import { EstimateForm } from "@/components/store/estimate-form";
import { ESTIMATE_DISCLAIMER } from "@/features/quotes/estimate";

export const metadata: Metadata = {
  title: "Calculá tu alambrado",
  description: "Estimación de materiales para un cerco. Sujeta a validación en el local.",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-heading text-4xl">Calculá tu alambrado</h1>
      <p className="mt-3 text-sm leading-relaxed">{ESTIMATE_DISCLAIMER}</p>
      <div className="mt-8">
        <EstimateForm />
      </div>
    </div>
  );
}
