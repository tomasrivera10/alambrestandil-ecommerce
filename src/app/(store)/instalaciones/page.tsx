import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin, Plus } from "lucide-react";
import { InstallationForm } from "@/components/store/installation-form";
import { InstallationGallery } from "@/components/store/installation-gallery";
import { FadeContent } from "@/components/store/fade-content";
import styles from "./instalaciones.module.css";

export const metadata: Metadata = {
  title: "Instalaciones",
  description:
    "Materiales y colocación de cercos, postes y portones en Tandil y la zona. Mirá nuestros trabajos y solicitá un presupuesto para tu obra.",
};
const questions = [
  [
    "¿Qué trabajos puedo consultar?",
    "Cercos perimetrales con tejido galvanizado o revestido, postes rectos u olímpicos, puertas y portones. Definimos los materiales según tu obra.",
  ],
  [
    "¿Todavía no tengo las medidas?",
    "Podés dejarlas en blanco y aclararlo en observaciones. Si las tenés, indicá metros aproximados y qué lados querés cerrar.",
  ],
  [
    "¿Cómo preparo el terreno?",
    "Al momento de la colocación, el suelo tiene que estar limpio. Avisanos si hay pendientes, obstáculos o un cerco existente.",
  ],
  [
    "¿La solicitud ya es un presupuesto final?",
    "Es el inicio de la consulta. Revisamos medidas, materiales y condiciones del terreno antes de definir el presupuesto.",
  ],
];
export default function Page() {
  return (
    <div className={`store-container ${styles.page}`}>
      <nav className="breadcrumbs" aria-label="Ubicación">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Instalaciones</span>
      </nav>
      <header className={styles.header}>
        <div>
          <h1>
            Tu cerco.
            <br />
            De principio a fin.
          </h1>
          <p>Materiales y colocación de cercos, postes y portones.</p>
        </div>
        <div className={styles.headerAction}>
          <span>
            <MapPin size={16} /> Tandil y la zona
          </span>
          <Link href="#presupuesto" className="store-button">
            Prepará tu consulta <ArrowUpRight size={18} />
          </Link>
        </div>
      </header>
      <div className={styles.grid}>
        <div className={styles.workColumn}>
          <FadeContent>
            <InstallationGallery />
          </FadeContent>
          <div className={styles.materials}>
            <span>Tejidos</span>
            <span>Postes</span>
            <span>Portones</span>
            <Link href="/productos">
              Ver materiales <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <section
          id="presupuesto"
          className={styles.formPanel}
          aria-labelledby="installation-quote-heading"
        >
          <h2 id="installation-quote-heading">Contanos tu proyecto</h2>
          <InstallationForm />
        </section>
      </div>
      <section className={styles.planning} aria-labelledby="installation-planning-heading">
        <div>
          <h2 id="installation-planning-heading">Arrancá con lo que sabés.</h2>
          <p>Te ayudamos a definir el resto.</p>
          <Link href="/calcular-alambrado" className="text-link">
            ¿Solo necesitás materiales? Calculalos <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className={styles.questions}>
          {questions.map(([title, answer]) => (
            <details key={title}>
              <summary>
                {title}
                <Plus size={18} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
