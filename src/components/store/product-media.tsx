/* eslint-disable @next/next/no-img-element -- Admin-managed external URLs are not restricted to one host. */
import Image from "next/image";
import { Package } from "lucide-react";
export function ProductMedia({
  src,
  alt,
  name,
  ratio = "aspect-square",
}: {
  src: string | null;
  alt: string | null;
  name: string;
  ratio?: string;
}) {
  if (src)
    return (
      <div className={`product-media ${ratio}`}>
        {src.startsWith("/") ? (
          <Image
            src={src}
            alt={alt || name}
            fill
            sizes="(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 90vw"
          />
        ) : (
          <img src={src} alt={alt || name} loading="lazy" />
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
