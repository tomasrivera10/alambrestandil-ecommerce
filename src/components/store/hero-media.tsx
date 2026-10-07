"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
export function HeroMedia({ videoSrc }: { videoSrc?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!videoSrc) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) video.current?.pause();
      else video.current?.play().catch(() => {});
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [videoSrc]);
  return (
    <div className="hero-media">
      <Image
        src="/images/hero/alambrado-tandil-editado.webp"
        alt="Alambrado romboidal instalado con postes de hormigón y cartel de Alambres Tandil"
        fill
        preload
        sizes="100vw"
        className="hero-photo"
      />
      {videoSrc && !failed && (
        <>
          <video
            ref={video}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="none"
            className="hero-video"
            onError={() => setFailed(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-hidden="true"
          />
          <button
            className="hero-pause"
            type="button"
            onClick={() => {
              if (playing) video.current?.pause();
              else video.current?.play().catch(() => {});
            }}
            aria-label={playing ? "Pausar video de portada" : "Reproducir video de portada"}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
        </>
      )}
    </div>
  );
}
