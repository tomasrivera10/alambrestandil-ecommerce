import { useId } from "react";
import { BrandLogo } from "./brand-logo";
import styles from "./store-loading.module.css";

// A continuous zigzag is the actual bent strand of a chain-link fence.
const strand = "M0 -24 Q-3 -20 0 -16 L17 5 Q21 10 17 15 L0 36 Q-4 41 0 46 L17 67 Q21 72 17 77 L0 98 Q-4 103 0 108 L17 129 Q21 134 17 139 L0 160 Q-4 165 0 170 L17 191";

export function StoreLoading({ transition = false }: { transition?: boolean }) {
  const id = useId();
  const steel = `${id}-steel`;
  const mesh = `${id}-mesh`;
  const fence = `${id}-fence`;

  return (
    <div
      className={transition ? styles.transition : styles.loading}
      role={transition ? undefined : "status"}
      aria-hidden={transition || undefined}
      aria-label={transition ? undefined : "Cargando Alambres Tandil"}
    >
      <div className={styles.content}>
        <div className={styles.brand}><BrandLogo /></div>
        <svg className={styles.wire} viewBox="0 0 440 220" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={steel} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#596369" />
              <stop offset=".22" stopColor="#c0c8cc" />
              <stop offset=".42" stopColor="#f2f5f6" />
              <stop offset=".64" stopColor="#9ba6ac" />
              <stop offset="1" stopColor="#535f66" />
            </linearGradient>
            <linearGradient id={`${steel}-rail`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#596369" />
              <stop offset=".35" stopColor="#eef2f3" />
              <stop offset="1" stopColor="#7d8990" />
            </linearGradient>
            <pattern id={mesh} width="36" height="62" patternUnits="userSpaceOnUse">
              {[0, 18, 36].map((x) => (
                <g key={x} transform={`translate(${x} 0) scale(${x === 18 ? -1 : 1} 1)`}>
                  <path d={strand} stroke="#59666e" strokeWidth="2.5" />
                  <path d={strand} stroke="#dfe5e8" strokeWidth=".9" transform="translate(-.45 -.4)" />
                </g>
              ))}
            </pattern>
            <clipPath id={fence}><path d="M55 39H385V185H55z" /></clipPath>
          </defs>
          <ellipse cx="220" cy="201" rx="185" ry="7" fill="#171b1f" opacity=".06" />
          <g className={styles.mesh} clipPath={`url(#${fence})`}>
            <path d="M55 39H385V185H55z" fill={`url(#${mesh})`} />
            <path d="M55 43H385M55 181H385" stroke="#89969d" strokeWidth="1.8" />
            <path d="M55 42H385M55 180H385" stroke="#eef2f3" strokeWidth=".7" />
          </g>
          <g fill={`url(#${steel})`}>
            <rect x="48" y="31" width="10" height="164" rx="3" />
            <rect x="382" y="31" width="10" height="164" rx="3" />
            <rect x="53" y="30.5" width="334" height="7" rx="3.5" fill={`url(#${steel}-rail)`} />
          </g>
          <g fill={`url(#${steel})`}>
            <path d="M46 30a7 7 0 0 1 14 0v3H46zM380 30a7 7 0 0 1 14 0v3h-14z" />
          </g>
          <g stroke="#65727a" strokeWidth="1.8" strokeLinecap="round">
            {[57, 100, 143, 180].map((y) => <path key={y} d={`M48 ${y}q6 5 14 0m316 0q7 5 14 0`} />)}
          </g>
          <g className={styles.gleam} clipPath={`url(#${fence})`}>
            <path d="M90 40 150 185M105 40 165 185" stroke="#fff" strokeWidth="8" opacity=".65" />
          </g>
        </svg>
        <p className={styles.message}>Preparando tu visita<span>…</span></p>
      </div>
    </div>
  );
}
