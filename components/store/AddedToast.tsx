"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { IconCheck, IconClose } from "@/components/ui/Icons";
import { formatCOP } from "@/utils/format";

export function AddedToast() {
  const { lastAdded, dismissAdded, count } = useCart();
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(dismissAdded, 5000);
    return () => clearTimeout(t);
  }, [lastAdded, dismissAdded]);
  if (!lastAdded) return null;
  return (
    <div className="fixed z-[55] top-[84px] right-3 left-3 sm:left-auto sm:right-6 sm:w-[380px] slide-up" role="status" aria-live="polite">
      <div className="bg-paper border border-line rounded-[22px] p-4 shadow-[0_24px_60px_-30px_rgba(17,17,17,0.4)]">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow inline-flex items-center gap-2 !text-ink"><IconCheck size={14} /> Agregado a tu bolsa</p>
          <button type="button" onClick={dismissAdded} aria-label="Cerrar" className="h-9 w-9 -mr-1 inline-flex items-center justify-center rounded-full hover:bg-mist">
            <IconClose size={16} />
          </button>
        </div>
        <div className="flex gap-3.5 items-center">
          <div className="h-[72px] w-[60px] rounded-xl bg-mist overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {lastAdded.image ? <img src={lastAdded.image} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] truncate">{lastAdded.name}</p>
            <p className="text-[12px] text-stone mt-0.5">{lastAdded.color} · Talla {lastAdded.size}</p>
            <p className="text-[13px] mt-1 tabular-nums">{formatCOP(lastAdded.price)}</p>
          </div>
        </div>
        <Link href="/carrito" onClick={dismissAdded} className="btn btn-primary btn-sm w-full mt-4">
          Ver bolsa ({count})
        </Link>
      </div>
    </div>
  );
}
