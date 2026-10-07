"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cartCount, useCart, useCartLines } from "@/features/cart/store";
import { formatMoney, unitLabel } from "@/lib/format";
import { ProductMedia } from "./product-media";
export function CartSheet() {
  const lines = useCartLines();
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const count = cartCount(lines);
  const [open, setOpen] = useState(false);
  const priced = lines.filter(
    (line) => line.unitPrice != null && line.priceVisibility !== "HIDDEN",
  );
  const estimated = priced.reduce((sum, line) => sum + line.unitPrice! * line.quantity, 0);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            className="cart-trigger"
            aria-label={`Mi pedido, ${count} materiales`}
          />
        }
      >
        <ShoppingBag size={22} />
        <span>Mi pedido</span>
        <span className="cart-count">{count}</span>
      </SheetTrigger>
      <SheetContent side="right" className="store-panel cart-panel">
        <SheetHeader>
          <SheetTitle>Tu próximo proyecto.</SheetTitle>
          <SheetDescription>
            {lines.length
              ? `${lines.length} ${lines.length === 1 ? "material" : "materiales"} en tu pedido`
              : "Tu lista de materiales empieza acá."}
          </SheetDescription>
        </SheetHeader>
        {!lines.length ? (
          <div className="cart-empty">
            <ShoppingBag size={44} strokeWidth={1} />
            <h3>Todavía hay lugar para tus ideas.</h3>
            <p>Recorré el catálogo, elegí tus materiales y los vamos sumando acá.</p>
            <Button
              nativeButton={false}
              render={<Link href="/productos" />}
              onClick={() => setOpen(false)}
            >
              Explorá el catálogo <ArrowUpRight size={17} />
            </Button>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((line) => (
                <li key={line.variantId}>
                  <Link href={line.href} onClick={() => setOpen(false)} className="cart-line-image">
                    <ProductMedia
                      src={line.imageUrl}
                      alt={line.productName}
                      name={line.productName}
                    />
                  </Link>
                  <div>
                    <Link
                      href={line.href}
                      onClick={() => setOpen(false)}
                      className="cart-line-name"
                    >
                      {line.productName}
                    </Link>
                    <p>{line.variantName}</p>
                    <span className="cart-line-price">
                      {line.unitPrice == null || line.priceVisibility === "HIDDEN"
                        ? "Precio a confirmar"
                        : `${line.priceVisibility === "FROM" ? "Desde " : ""}${formatMoney(line.unitPrice)} / ${unitLabel(line.unit, 1)}`}
                    </span>
                    <div className="cart-line-controls">
                      <label>
                        Cantidad
                        <input
                          type="number"
                          min={1}
                          step={["METRO", "KG"].includes(line.unit) ? "0.001" : "1"}
                          value={line.quantity}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isFinite(value) && value >= 1)
                              setQuantity(line.variantId, value);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        aria-label={`Quitar ${line.productName}`}
                        onClick={() => remove(line.variantId)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-summary">
              <div>
                <span>
                  {priced.length < lines.length ? "Subtotal con precio" : "Total estimado"}
                </span>
                <strong>{priced.length ? formatMoney(estimated) : "A confirmar"}</strong>
              </div>
              <p>Confirmamos precio, disponibilidad y entrega por WhatsApp.</p>
              <Button
                nativeButton={false}
                render={<Link href="/pedido" />}
                onClick={() => setOpen(false)}
              >
                Revisar y enviar pedido <ArrowUpRight size={17} />
              </Button>
              <button type="button" className="cart-continue" onClick={() => setOpen(false)}>
                Seguir eligiendo materiales
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
