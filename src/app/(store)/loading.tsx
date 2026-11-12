import styles from "./loading.module.css";

export default function StoreLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <div className={styles.content}>
        <svg className={styles.wire} viewBox="0 0 320 140" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="loading-steel" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#424950" />
              <stop offset=".28" stopColor="#f4f6f6" />
              <stop offset=".48" stopColor="#8b969a" />
              <stop offset=".72" stopColor="#e7ebeb" />
              <stop offset="1" stopColor="#454d51" />
            </linearGradient>
            <linearGradient id="loading-wire" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#343b3e" />
              <stop offset=".44" stopColor="#e7eded" />
              <stop offset="1" stopColor="#737e81" />
            </linearGradient>
          </defs>
          <ellipse cx="111" cy="112" rx="84" ry="9" fill="#171a1d" opacity=".08" />
          <g className={styles.coil} stroke="url(#loading-steel)" strokeWidth="5.5">
            <ellipse cx="89" cy="68" rx="49" ry="44" transform="rotate(-17 89 68)" />
            <ellipse cx="96" cy="67" rx="49" ry="44" transform="rotate(-17 96 67)" />
            <ellipse cx="103" cy="66" rx="49" ry="44" transform="rotate(-17 103 66)" />
            <ellipse cx="110" cy="65" rx="49" ry="44" transform="rotate(-17 110 65)" />
            <ellipse cx="117" cy="64" rx="49" ry="44" transform="rotate(-17 117 64)" />
            <ellipse cx="124" cy="63" rx="49" ry="44" transform="rotate(-17 124 63)" />
            <ellipse cx="131" cy="62" rx="49" ry="44" transform="rotate(-17 131 62)" />
            <ellipse cx="138" cy="61" rx="49" ry="44" transform="rotate(-17 138 61)" />
          </g>
          <path className={styles.looseWire} d="M167 95c16 10 21 17 38 17h103" stroke="url(#loading-wire)" strokeWidth="5" strokeLinecap="round" />
          <path className={styles.wireGleam} d="M167 95c16 10 21 17 38 17h103" stroke="#fff" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <p className={styles.message}>Preparando tu producto<span className={styles.ellipsis}>…</span></p>
      </div>
    </div>
  );
}
