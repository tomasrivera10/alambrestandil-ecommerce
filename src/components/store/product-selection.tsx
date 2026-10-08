"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { variantImageIndex } from "@/features/products/variant-image";
type Variant = { id: string; name: string; sku: string; attributes: Record<string, string> };
const Selection = createContext<{
  id: string;
  select: (id: string) => void;
  imageIndex: number;
  imageUrl: string | null;
} | null>(null);
export const useProductSelection = () => useContext(Selection);
export function ProductSelection({
  variants,
  images,
  children,
}: {
  variants: Variant[];
  images: { url: string; alt: string }[];
  children: ReactNode;
}) {
  const [id, select] = useState(
    () =>
      [...variants].sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))[0]?.id ??
      "",
  );
  const imageIndex = variantImageIndex(
    images,
    variants.find((variant) => variant.id === id),
  );
  return (
    <Selection.Provider
      value={{ id, select, imageIndex, imageUrl: images[imageIndex]?.url ?? null }}
    >
      {children}
    </Selection.Provider>
  );
}
