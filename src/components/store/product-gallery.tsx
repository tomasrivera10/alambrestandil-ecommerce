"use client";
import { useState } from "react";
import { ProductMedia } from "./product-media";
export function ProductGallery({
  images,
  name,
  reference = false,
}: {
  images: { url: string; alt: string; isReference?: boolean; sourceUrl?: string | null }[];
  name: string;
  reference?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const image = images[selected];
  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <ProductMedia
          src={image?.url ?? null}
          alt={image?.alt ?? null}
          name={name}
          ratio="aspect-square"
        />
        {(reference || image?.isReference) && <span className="reference-label">Imagen de referencia</span>}
      </div>
      {image?.sourceUrl && <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline">Fuente de la fotografía</a>}
      {images.length > 1 && (
        <div className="product-thumbnails" aria-label="Galería del producto">
          {images.map((item, index) => (
            <button
              type="button"
              key={item.url}
              aria-label={`Ver imagen ${index + 1} de ${name}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              <ProductMedia src={item.url} alt={item.alt || name} name={name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
