"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cartCount, useCart } from "@/features/cart/store";
import { formatMoney, unitLabel } from "@/lib/format";
import Link from "next/link";

export function CartSheet() {
  const lines = useCart((state) => state.lines);
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const count = cartCount(lines);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="h-10 px-3">
            <ShoppingBag />
            Pedido
            <span className="font-mono tabular-nums">{count}</span>
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu pedido</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">
            Todavía no agregaste materiales. Recorré el catálogo y armá la lista.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className="flex-1 space-y-4 overflow-auto px-4">
              {lines.map((line) => (
                <li key={line.variantId} className="border-b border-border pb-4">
                  <p className="font-medium">{line.productName}</p>
                  <p className="text-sm text-muted-foreground">{line.variantName}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <label className="text-xs text-muted-foreground">
                      Cantidad
                      <input
                        className="ml-2 h-8 w-16 border border-input bg-transparent px-2 font-mono"
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          setQuantity(line.variantId, Number(event.target.value))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => remove(line.variantId)}
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-xs">
                    {line.unitPrice == null || line.priceVisibility === "HIDDEN"
                      ? "Precio a confirmar"
                      : `${formatMoney(line.unitPrice)} / ${unitLabel(line.unit, 1)}`}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-4">
              <Button
                className="w-full"
                nativeButton={false}
                render={<Link href="/pedido" />}
                onClick={() => setOpen(false)}
              >
                Continuar pedido
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
