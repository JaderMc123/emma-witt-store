"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OPEN_CONSENT_EVENT, openConsentPreferences, useConsent } from "@/hooks/useConsent";
import { cn } from "@/utils/format";

export function CookiePreferencesLink({ className }: { className?: string }) {
  return (
    <button type="button" className={cn("text-left", className)} onClick={openConsentPreferences}>
      Preferencias de cookies
    </button>
  );
}

function Toggle({ checked, onChange, disabled, label, desc }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string; desc: string }) {
  return (
    <label className={cn("flex items-start justify-between gap-6 py-4 border-b border-line/70", disabled ? "opacity-70" : "cursor-pointer")}>
      <span>
        <span className="block text-[14px]">{label}</span>
        <span className="block text-[13px] text-stone mt-1 leading-relaxed">{desc}</span>
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
        <span className="block h-7 w-12 rounded-full bg-line peer-checked:bg-ink transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2" />
        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-paper transition-transform duration-300 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function CookieBanner() {
  const { consent, loaded, save } = useConsent();
  const [configOpen, setConfigOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const open = () => {
      setForced(true);
      setConfigOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [consent]);

  const visible = loaded && (!consent || forced);
  if (!visible) return null;

  const done = (a: boolean, m: boolean) => {
    save({ analytics: a, marketing: m });
    setForced(false);
    setConfigOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5 pointer-events-none safe-bottom">
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Preferencias de cookies"
        className="pointer-events-auto mx-auto max-w-[560px] sm:ml-0 bg-paper border border-line rounded-[22px] p-6 sm:p-7 shadow-[0_20px_60px_-30px_rgba(17,17,17,0.35)] slide-up"
      >
        {!configOpen ? (
          <>
            <p className="eyebrow mb-3">Cookies</p>
            <p className="text-[14px] leading-relaxed text-ink/85">
              Usamos cookies necesarias para que la tienda funcione. Con tu permiso, también usaremos cookies analíticas y de marketing para mejorar tu experiencia.{" "}
              <Link href="/cookies" className="underline underline-offset-4">Más información</Link>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button type="button" className="btn btn-primary btn-sm col-span-2" onClick={() => done(true, true)}>
                Aceptar todas
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => done(false, false)}>
                Rechazar no esenciales
              </button>
              <button type="button" className="btn btn-ghost btn-sm border border-line" onClick={() => setConfigOpen(true)}>
                Configurar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow mb-2">Configurar cookies</p>
            <div>
              <Toggle checked disabled label="Necesarias" desc="Carrito, preferencias y seguridad. Siempre activas." />
              <Toggle checked={analytics} onChange={setAnalytics} label="Analíticas" desc="Nos ayudan a entender cómo se usa la tienda." />
              <Toggle checked={marketing} onChange={setMarketing} label="Marketing" desc="Permiten mostrarte contenido y anuncios relevantes." />
            </div>
            <div className="mt-6 flex gap-2.5">
              <button type="button" className="btn btn-primary btn-sm flex-1" onClick={() => done(analytics, marketing)}>
                Guardar preferencias
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => done(true, true)}>
                Aceptar todas
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
