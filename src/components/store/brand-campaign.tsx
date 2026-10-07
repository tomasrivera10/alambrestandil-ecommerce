"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Pause, Play, Plus } from "lucide-react";
export function BrandCampaign() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`brand-campaign ${paused ? "is-paused" : ""}`}
      aria-labelledby="romboidal-title"
    >
      <div className="store-container campaign-grid">
        <div className="campaign-copy">
          <Image
            src="/brand/romboidal-logo.png"
            alt="Romboidal · Línea de alambrados"
            width={175}
            height={107}
            className="romboidal-logo"
          />
          <h2 id="romboidal-title">
            Un cerco fuerte.
            <br />
            Una gran marca detrás.
          </h2>
          <p>
            Trabajamos con productos Romboidal. Encontrá los materiales para tu proyecto y
            consultanos por la medida que necesitás.
          </p>
          <Link href="/productos?marca=Romboidal" className="store-button button-light">
            Explorá Romboidal <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="campaign-photo">
          <Image
            src="/images/tandil/rollos.webp"
            alt="Detalle de rollos de malla en el depósito de Alambres Tandil"
            fill
            sizes="(min-width: 900px) 50vw, 100vw"
          />
          <span className="campaign-photo-label">Materiales que hacen la diferencia.</span>
        </div>
      </div>
      <div className="campaign-ticker">
        <div className="ticker-window" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((i) => (
              <span key={i}>
                TEJIDOS GALVANIZADOS <Plus /> REVESTIDOS <Plus /> MALLAS <Plus /> ROMBOIDAL <Plus />
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Reanudar animación de Romboidal" : "Pausar animación de Romboidal"}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
      </div>
    </section>
  );
}
