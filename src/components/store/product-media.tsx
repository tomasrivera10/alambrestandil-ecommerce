/* eslint-disable @next/next/no-img-element -- Admin-managed external URLs are not restricted to one host. */
import Image from "next/image";
import { Package } from "lucide-react";
export function ProductMedia({
  src,
  alt,
  name,
  ratio = "aspect-square",
  sizes = "(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 90vw",
  preload = false,
}: {
  src: string | null;
  alt: string | null;
  name: string;
  ratio?: string;
  sizes?: string;
  preload?: boolean;
}) {
  if (src)
    return (
      <div className={`product-media ${ratio}`}>
        {src.startsWith("/") ? (
          <Image src={src} alt={alt || name} fill sizes={sizes} preload={preload} />
        ) : (
          <img src={src} alt={alt || name} loading={preload ? "eager" : "lazy"} />
        )}
      </div>
    );
  return (
    <div className={`product-media product-media-empty ${ratio}`}>
      <Package size={48} strokeWidth={1} />
      <span>{name}</span>
      <small>Foto próximamente</small>
    </div>
  );
}
