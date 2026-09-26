"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArrow, IconMinus, IconPlus, IconTrash } from "@/components/ui/Icons";
import { useCart } from "@/hooks/useCart";
import { useQuote } from "@/hooks/useQuote";
import { cn, formatCOP } from "@/utils/format";

export default function CartPage() {
  const { items, ready, setQuantity, remove } = useCart();
  const { quote, loading, error } = useQuote(items, ready);

  useEffect(() => {
    document.title = "Tu bolsa · Emma WITT Collection";
  }, []);

  if (!ready) return <div className="min-h-[60vh]" />;

  if (!items.length) {
    return (
      <EmptyState
        eyebrow="Tu bolsa"
        title="Tu bolsa está vacía."
        text="Encuentra ese par que te acompañe a todas partes."
        cta="Descubrir colección"
        href="/catalogo"
      />
    );
  }

  const lineFor = (variantId: string) => quote?.lines.find((l) => l.variant_id === variantId);
  const hasIssues = quote ? !quote.valid : false;

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8 pt-10 sm:pt-16">
      <header className="mb-10 slide-up">
        <p className="eyebrow mb-3">Tu bolsa</p>
        <h1 className="display text-[48px] sm:text-[68px]">Tu selección</h1>
      </header>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
        <ul className="lg:col-span-7 divide-y divide-line/70 border-y border-line/70">
          {items.map((item) => {
            const line = lineFor(item.variantId);
            const price = line?.unit_price ?? item.price;
            const problem =
              line && !line.available
                ? line.reason === "sold_out"
                  ? "Agotado — retíralo para continuar."
                  : line.reason === "insufficient"
                  ? `Solo quedan ${line.stock} unidades.`
                  : "Ya no está disponible."
                : null;
            return (
              <li key={item.variantId} className="py-6 flex gap-4 sm:gap-6 fade-in">
                <Link href={`/producto/${item.slug}`} className="h-[132px] w-[106px] sm:h-[150px] sm:w-[120px] shrink-0 overflow-hidden rounded-[16px] bg-mist">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/producto/${item.slug}`} className="text-[15px] leading-snug hover:underline underline-offset-4">{item.name}</Link>
                      <p className="text-[12.5px] text-stone mt-1">{item.color} · Talla {item.size}</p>
                      <p className="text-[11px] tracking-[0.12em] text-stone/80 mt-1 tabular-nums">{item.sku}</p>
                    </div>
                    <p className="text-[14px] tabular-nums shrink-0">{formatCOP(price * item.quantity)}</p>
                  </div>
                  {problem ? <p className="mt-2 text-[13px] text-danger" role="alert">{problem}</p> : null}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <button type="button" className="h-10 w-10 inline-flex items-center justify-center" onClick={() => setQuantity(item.variantId, item.quantity - 1)} aria-label={`Disminuir cantidad de ${item.name}`}>
                        <IconMinus size={14} />
                      </button>
                      <span className="w-7 text-center text-[14px] tabular-nums" aria-label="Cantidad">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-10 w-10 inline-flex items-center justify-center disabled:opacity-30"
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        disabled={line?.stock !== undefined && item.quantity >= line.stock}
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(item.variantId)} className="h-10 inline-flex items-center gap-2 px-3 -mr-3 rounded-full text-[11px] tracking-[0.16em] uppercase text-stone hover:text-ink hover:bg-mist transition">
                      <IconTrash size={16} /> Quitar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-[108px] rounded-[24px] bg-paper border border-line/70 p-6 sm:p-8">
            <p className="eyebrow mb-6 !text-ink">Resumen</p>
            <dl className={cn("space-y-3 text-[14px] transition-opacity", loading && "opacity-60")}>
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatCOP(quote?.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0))}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Envío</dt><dd className="text-stone">Se calcula en el siguiente paso</dd></div>
            </dl>
            {error ? <p className="mt-4 text-[13px] text-danger">No pudimos verificar la disponibilidad. Revisa tu conexión.</p> : null}
            {hasIssues ? <p className="mt-4 text-[13px] text-danger">Ajusta los productos marcados para continuar.</p> : null}
            <Link
              href="/checkout"
              aria-disabled={hasIssues || !quote}
              className={cn("btn btn-primary w-full mt-8", (hasIssues || !quote) && "pointer-events-none opacity-40")}
            >
              Continuar compra <IconArrow size={16} />
            </Link>
            <p className="mt-4 text-center text-[12px] text-stone">Sin registro · Confirmamos tu pedido por WhatsApp</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
