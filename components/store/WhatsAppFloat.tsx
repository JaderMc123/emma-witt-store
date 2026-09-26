"use client";

import { usePathname } from "next/navigation";
import { IconWhatsApp } from "@/components/ui/Icons";
import { waLink } from "@/utils/format";

export function WhatsAppFloat({ number, storeName }: { number: string | null; storeName: string }) {
  const pathname = usePathname();
  // En producto/checkout/carrito ya hay una acción principal: no competir con ella.
  if (/^\/(producto|checkout|carrito|pedido)/.test(pathname || "")) return null;
  return (
    <a
      href={waLink(number, `Hola ${storeName} 👋 Quisiera más información.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 h-14 w-14 rounded-full bg-ink text-ivory inline-flex items-center justify-center shadow-[0_14px_40px_-16px_rgba(17,17,17,0.6)] hover:scale-105 transition-transform duration-500 fade-in"
    >
      <IconWhatsApp size={24} />
    </a>
  );
}
