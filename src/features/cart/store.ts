"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productName: string;
  variantName: string;
  href: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  priceVisibility: "PUBLIC" | "HIDDEN" | "FROM";
  imageUrl: string | null;
};

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const existing = state.lines.find((item) => item.variantId === line.variantId);
          if (!existing) return { lines: [...state.lines, line] };
          return {
            lines: state.lines.map((item) =>
              item.variantId === line.variantId
                ? { ...item, quantity: item.quantity + line.quantity }
                : item,
            ),
          };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        })),
      remove: (variantId) =>
        set((state) => ({ lines: state.lines.filter((item) => item.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "at-pedido" },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
