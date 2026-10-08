"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import styles from "./installation-form.module.css";
import { createQuote } from "@/features/quotes/actions";

export function InstallationForm() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ number: number; url: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = ["Tu terreno", "El cerco", "Contacto"];
  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || result) return;
        const element = event.currentTarget;
        const fields = element.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] input`);
        for (const field of fields) {
          if (!field.reportValidity()) return;
        }
        if (step < 2) {
          goTo(step + 1);
          return;
        }
        const form = new FormData(element);
        setPending(true);
        setError(null);
        try {
          const result = await createQuote({
            origin: "INSTALLATION",
            name: String(form.get("name")),
            phone: String(form.get("phone")),
            locality: String(form.get("locality")),
            address: String(form.get("address")),
            notes: String(form.get("notes") || ""),
            payload: {
              tissue: form.get("tissue"),
              post: form.get("post"),
              terrain: form.get("terrain"),
              mesh: form.get("mesh"),
              length: form.get("length"),
              width: form.get("width"),
              depth: form.get("depth"),
              gate: form.get("gate"),
              gateLocation: form.get("gateLocation"),
            },
            items: [
              {
                name: `Instalación ${form.get("tissue")} con poste ${form.get("post")}`,
                quantity: 1,
                unit: "JUEGO",
                note: `Medidas aproximadas: largo ${form.get("length") || "a definir"}, ancho ${form.get("width") || "a definir"}, fondo ${form.get("depth") || "a definir"}. Valores en metros.`,
              },
            ],
          });
          setResult(result);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No pudimos enviar la solicitud.");
        } finally {
          setPending(false);
        }
      }}
    >
      <ol className={styles.steps} aria-label="Pasos del presupuesto">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            data-complete={index < step}
          >
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h3 ref={heading} tabIndex={-1} className={styles.stepHeading}>
        {steps[step]}
      </h3>
      <p className={styles.hint}>
        {
          [
            "Ubicación y medidas aproximadas en metros.",
            "Elegí los materiales o pedinos asesoramiento.",
            "Dejanos tus datos para preparar la consulta.",
          ][step]
        }
      </p>
      <fieldset data-step="0" hidden={step !== 0}>
        <label className="grid gap-1">
          Localidad
          <Input name="locality" required defaultValue="Tandil" />
        </label>
        <label className="grid gap-1">
          Dirección de la obra
          <Input name="address" required />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            Largo
            <Input name="length" type="number" min="0.1" step="any" placeholder="m" />
          </label>
          <label className="grid gap-1">
            Ancho
            <Input name="width" type="number" min="0.1" step="any" placeholder="m" />
          </label>
          <label className="grid gap-1">
            Fondo
            <Input name="depth" type="number" min="0.1" step="any" placeholder="m" />
          </label>
        </div>
      </fieldset>
      <fieldset data-step="1" hidden={step !== 1}>
        <label className="grid gap-1">
          Tipo de tejido
          <select name="tissue" className="h-10 border border-input bg-card px-2">
            <option>Necesito asesoramiento</option>
            <option>Símil ligustrina</option>
            <option>Revestido en PVC</option>
            <option>Galvanizado romboidal</option>
          </select>
        </label>
        <label className="grid gap-1">
          Poste
          <select name="post" className="h-10 border border-input bg-card px-2">
            <option>Necesito asesoramiento</option>
            <option>Olímpico</option>
            <option>Recto</option>
          </select>
        </label>
        <label className="grid gap-1">
          Terreno
          <select name="terrain" className="h-10 border border-input bg-card px-2">
            <option>Lote</option>
            <option>Lote con ochava</option>
          </select>
        </label>
        <label className="grid gap-1">
          Malla
          <select name="mesh" className="h-10 border border-input bg-card px-2">
            <option>A definir</option>
            <option>1 1/2</option>
            <option>2</option>
            <option>2 1/2</option>
            <option>3 1/2</option>
          </select>
        </label>
        <label className="grid gap-1">
          Portón
          <select name="gate" className="h-10 border border-input bg-card px-2">
            <option>Sin portón</option>
            <option>A definir</option>
            <option>Caño estructural, línea económica</option>
            <option>Caño estructural, reforzado</option>
          </select>
        </label>
        <label className="grid gap-1">
          Ubicación del portón
          <select name="gateLocation" className="h-10 border border-input bg-card px-2">
            <option>Frente</option>
            <option>Lateral</option>
            <option>Fondo</option>
          </select>
        </label>
      </fieldset>
      <fieldset data-step="2" hidden={step !== 2}>
        <label className="grid gap-1">
          Nombre
          <Input name="name" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
        <label className="grid gap-1">
          Teléfono
          <Input name="phone" minLength={8} maxLength={30} type="tel" autoComplete="tel" required />
        </label>
        <label className="grid gap-1">
          Observaciones
          <Textarea
            name="notes"
            maxLength={500}
            placeholder="Qué lados querés cerrar, pendientes, dudas…"
          />
        </label>
      </fieldset>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {result ? (
        <div className={styles.success} role="status">
          <Check size={20} />
          <p>Solicitud CT-{result.number} guardada.</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            Continuar por WhatsApp <MessageCircle size={17} />
          </a>
        </div>
      ) : (
        <div className={styles.actions}>
          {step > 0 && (
            <button type="button" onClick={() => goTo(step - 1)} disabled={pending}>
              <ArrowLeft size={16} /> Atrás
            </button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? (
              "Guardando solicitud…"
            ) : step < 2 ? (
              <>
                Continuar <ArrowRight size={17} />
              </>
            ) : (
              "Preparar consulta"
            )}
          </Button>
        </div>
      )}
      <p className={styles.footnote}>
        Sin compromiso. Revisamos medidas y condiciones antes de cotizar.
      </p>
    </form>
  );
}
