"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/utils/format";
import { IconCheck, IconClose } from "@/components/ui/Icons";

/* ——— Toast ——— */
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed z-[80] bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[420px]" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn("slide-up rounded-full px-5 py-3.5 text-[13.5px] flex items-center gap-3 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)]", t.tone === "ok" ? "bg-ink text-ivory" : "bg-danger text-white")}>
            {t.tone === "ok" ? <IconCheck size={16} /> : <IconClose size={16} />} {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ——— Layout ——— */
export function PageHeader({ eyebrow, title, actions, back }: { eyebrow?: string; title: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 sm:mb-10">
      {back ? (
        <Link href={back.href} className="inline-block mb-4 text-[11px] tracking-[0.18em] uppercase text-stone hover:text-ink">
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="display text-[36px] sm:text-[46px]">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-[22px] bg-paper border border-line/70 p-5 sm:p-7", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[11.5px] tracking-[0.2em] uppercase">{title}</h2>
            {description ? <p className="text-[13px] text-stone mt-1.5 leading-relaxed">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-[12px] text-stone leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex items-start justify-between gap-5", disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
      <span>
        <span className="block text-[14px]">{label}</span>
        {description ? <span className="block text-[12.5px] text-stone mt-0.5 leading-relaxed">{description}</span> : null}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-7 w-12 rounded-full bg-line peer-checked:bg-ink transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30" />
        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-paper transition-transform duration-300 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

const STATUS_TONE: Record<string, string> = {
  pendiente: "bg-[#f3ead8] text-[#7a5b1e]",
  confirmado: "bg-[#e6ebf2] text-[#34506f]",
  pagado: "bg-[#e3ede4] text-[#3d5f40]",
  preparando: "bg-[#ece6f2] text-[#5a4474]",
  enviado: "bg-[#e4eef0] text-[#2f5d66]",
  entregado: "bg-ink text-ivory",
  cancelado: "bg-[#f3e2df] text-[#8c3a2c]",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] tracking-[0.14em] uppercase whitespace-nowrap", STATUS_TONE[status] || "bg-mist")}>{status}</span>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "dark" }) {
  const t = { neutral: "bg-mist text-stone", ok: "bg-[#e3ede4] text-[#3d5f40]", warn: "bg-[#f3ead8] text-[#7a5b1e]", danger: "bg-[#f3e2df] text-[#8c3a2c]", dark: "bg-ink text-ivory" }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] tracking-[0.12em] uppercase whitespace-nowrap", t)}>{children}</span>;
}

export function ConfirmButton({ onConfirm, children, className, confirmLabel = "¿Confirmar?" }: { onConfirm: () => void | Promise<void>; children: React.ReactNode; className?: string; confirmLabel?: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  if (armed) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          className="btn btn-sm !bg-danger !text-white"
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
            setArmed(false);
          }}
        >
          {busy ? "…" : confirmLabel}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setArmed(false)}>No</button>
      </span>
    );
  }
  return (
    <button type="button" className={className || "btn btn-sm btn-ghost text-danger"} onClick={() => setArmed(true)}>
      {children}
    </button>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] bg-paper border border-line/70 p-5 sm:p-6">
      <p className="eyebrow">{label}</p>
      <p className="display text-[34px] sm:text-[40px] mt-3 tabular-nums leading-none">{value}</p>
      {sub ? <p className="text-[12.5px] text-stone mt-2">{sub}</p> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="py-24 flex justify-center" aria-label="Cargando">
      <span className="h-8 w-8 rounded-full border border-line border-t-ink animate-spin" />
    </div>
  );
}

export function AdminEmpty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <span aria-hidden className="mx-auto mb-6 block h-12 w-12 rounded-full border border-line" />
      <p className="display text-[26px]">{title}</p>
      {text ? <p className="text-stone text-[14px] mt-2">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
