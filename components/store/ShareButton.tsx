"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconLink, IconShare, IconWhatsApp } from "@/components/ui/Icons";
import { shareWhatsAppMessage } from "@/utils/whatsapp";

export function ShareButton({ name, sku, path, storeName }: { name: string; sku: string; path: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setCanNative(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const url = () => `${window.location.origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso */
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title: `${name} · ${storeName}`, text: `${name} (ID: ${sku})`, url: url() });
      setOpen(false);
    } catch {
      /* cancelado */
    }
  };

  const item = "flex w-full items-center gap-3 px-4 min-h-[48px] text-[14px] rounded-xl hover:bg-mist transition text-left";

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="h-11 inline-flex items-center gap-2 rounded-full px-4 -mr-4 text-[11.5px] tracking-[0.18em] uppercase hover:bg-mist transition" aria-expanded={open} aria-haspopup="menu">
        <IconShare size={17} /> Compartir
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-12 z-20 w-[240px] p-1.5 bg-paper border border-line rounded-[18px] shadow-[0_20px_50px_-24px_rgba(17,17,17,0.35)] slide-up">
          <a
            role="menuitem"
            className={item}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(shareWhatsAppMessage({ storeName, name, sku, url: typeof window !== "undefined" ? url() : path }))}`}
            onClick={() => setOpen(false)}
          >
            <IconWhatsApp size={18} /> WhatsApp
          </a>
          <button role="menuitem" type="button" className={item} onClick={copy}>
            {copied ? <IconCheck size={18} /> : <IconLink size={18} />} {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
          {canNative ? (
            <button role="menuitem" type="button" className={item} onClick={native}>
              <IconShare size={18} /> Más opciones
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
