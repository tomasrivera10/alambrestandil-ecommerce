"use client";
import { useSyncExternalStore } from "react";
import { site } from "@/content/site";
const subscribe = () => () => {};
export function OrderWhatsapp() {
  const url = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem("last-order-whatsapp") || site.whatsappLink,
    () => site.whatsappLink,
  );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="store-button button-red">
      Continuar por WhatsApp
    </a>
  );
}
