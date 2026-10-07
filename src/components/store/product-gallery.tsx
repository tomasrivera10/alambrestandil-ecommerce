"use client";
import { useState } from "react";
import { Expand, X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
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
      <Dialog>
        <div className="product-gallery-main">
          <ProductMedia
            src={image?.url ?? null}
            alt={image?.alt ?? null}
            name={name}
            ratio="product-gallery-frame"
            sizes="(max-width: 800px) 90vw, 480px"
            preload
          />
          {image && (
            <DialogTrigger
              className="product-image-expand"
              aria-label={`Ampliar imagen de ${name}`}
            >
              <Expand size={16} /> Ampliar
            </DialogTrigger>
          )}
          {(reference || image?.isReference) && (
            <span className="reference-label">Imagen de referencia</span>
          )}
        </div>
        {image && (
          <DialogContent className="product-image-dialog" showCloseButton={false}>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>
              {reference || image.isReference
                ? "Imagen de referencia. La presentación puede variar según la medida elegida."
                : image.alt || "Fotografía del producto"}
            </DialogDescription>
            <DialogClose className="product-image-close" aria-label="Cerrar imagen">
              <X size={20} />
            </DialogClose>
            <ProductMedia
              src={image.url}
              alt={image.alt}
              name={name}
              ratio="product-image-expanded"
              sizes="90vw"
            />
          </DialogContent>
        )}
      </Dialog>
      <div className="product-gallery-caption">
        <span>
          {reference || image?.isReference
            ? "La imagen es orientativa de este producto."
            : "Fotografía del producto"}
        </span>
        {images.length > 1 && (
          <span>
            {selected + 1} / {images.length}
          </span>
        )}
      </div>
      {image?.sourceUrl && (
        <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="product-photo-source">
          Fuente de la fotografía
        </a>
      )}
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
