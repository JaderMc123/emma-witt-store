"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconMinus, IconPlus, IconWhatsApp } from "@/components/ui/Icons";
import { Price } from "@/components/ui/Price";
import { useCart } from "@/hooks/useCart";
import type { ProductFull } from "@/types";
import { STOCK_LABEL, cn, stockState, waLink } from "@/utils/format";
import { productWhatsAppMessage } from "@/utils/whatsapp";

type Props = {
  product: ProductFull;
  whatsapp: string | null;
  storeName: string;
  lowStock: number;
};

export function ProductPurchase({ product, whatsapp, storeName, lowStock }: Props) {
  const { add } = useCart();
  const colors = useMemo(() => {
    const m = new Map<string, { name: string; hex: string | null; stock: number }>();
    for (const v of product.variants) {
      const cur = m.get(v.color);
      m.set(v.color, { name: v.color, hex: v.color_hex, stock: (cur?.stock || 0) + v.stock });
    }
    return [...m.values()];
  }, [product.variants]);

  const [color, setColor] = useState<string | null>(() => (colors.find((c) => c.stock > 0) || colors[0])?.name ?? null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const sizes = useMemo(() => {
    const vs = product.variants.filter((v) => v.color === color);
    return vs.sort((a, b) => (Number(a.size) || 0) - (Number(b.size) || 0) || a.size.localeCompare(b.size));
  }, [product.variants, color]);

  const variant = sizes.find((v) => v.size === size) || null;
  const state = variant ? stockState(variant.stock, lowStock) : null;
  const productSoldOut = colors.every((c) => c.stock <= 0);

  useEffect(() => {
    // al cambiar color, conservar la talla si existe y hay stock
    if (size && !sizes.find((v) => v.size === size && v.stock > 0)) setSize(null);
    setQty(1);
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const requireVariant = () => {
    if (!variant) {
      setError("Selecciona tu talla para continuar.");
      document.getElementById("size-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (variant.stock <= 0) {
      setError("Esta talla está agotada. Elige otra o escríbenos.");
      return false;
    }
    setError(null);
    return true;
  };

  const waHref = () =>
    waLink(
      whatsapp,
      productWhatsAppMessage({
        storeName,
        name: product.name,
        sku: product.sku,
        color: variant?.color || color,
        size: variant?.size || null,
        quantity: qty,
        price: product.price * qty,
        url: `${window.location.origin}/producto/${product.slug}`,
      })
    );

  const buyWhatsApp = () => {
    if (!requireVariant()) return;
    window.open(waHref(), "_blank", "noopener,noreferrer");
  };

  const addToBag = () => {
    if (!requireVariant() || !variant) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      size: variant.size,
      color: variant.color,
      price: product.price,
      image: product.images[0]?.url || null,
      quantity: qty,
    });
  };

  const askSoldOut = () => {
    window.open(
      waLink(whatsapp, `Hola ${storeName} 👋 Me interesa ${product.name} (ID: ${product.sku})${color ? `, color ${color}` : ""}${size ? `, talla ${size}` : ""}. ¿Tendrán disponibilidad pronto?`),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div>
      {/* Color */}
      {colors.length ? (
        <fieldset className="mt-9">
          <legend className="field-label">
            Color <span className="normal-case tracking-normal text-ink ml-1">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Color">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={color === c.name}
                aria-label={`${c.name}${c.stock <= 0 ? ", agotado" : ""}`}
                onClick={() => setColor(c.name)}
                className={cn(
                  "h-11 w-11 rounded-full p-[3px] border transition-all duration-300",
                  color === c.name ? "border-ink" : "border-transparent hover:border-line",
                  c.stock <= 0 && "opacity-40"
                )}
              >
                <span className="block h-full w-full rounded-full ring-1 ring-line/80" style={{ background: c.hex || "#ccc" }} />
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {/* Talla */}
      <fieldset className="mt-8" id="size-group">
        <legend className="field-label flex w-full items-center justify-between">
          <span>Talla</span>
          {state ? (
            <span className={cn("normal-case tracking-[0.04em] text-[12px]", state === "agotado" ? "text-danger" : state === "ultimas" ? "text-[color:var(--accent)]" : "text-ok")}>
              {state === "ultimas" ? `${STOCK_LABEL.ultimas} · ${variant!.stock}` : STOCK_LABEL[state]}
            </span>
          ) : null}
        </legend>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2" role="radiogroup" aria-label="Talla">
          {sizes.map((v) => {
            const soldOut = v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={size === v.size}
                aria-disabled={soldOut}
                aria-label={`Talla ${v.size}${soldOut ? ", agotada" : ""}`}
                data-soldout={soldOut}
                onClick={() => {
                  if (soldOut) {
                    setSize(null);
                    setError(`La talla ${v.size} está agotada.`);
                    return;
                  }
                  setSize(v.size);
                  setError(null);
                  setQty(1);
                }}
                className="chip !px-0 tabular-nums !rounded-[14px]"
              >
                {v.size}
              </button>
            );
          })}
        </div>
        <p className={cn("mt-3 text-[13px] text-danger min-h-[20px] transition-opacity", error ? "opacity-100" : "opacity-0")} role="alert">
          {error}
        </p>
      </fieldset>

      {/* Cantidad */}
      {variant && variant.stock > 0 ? (
        <div className="mt-2 flex items-center gap-4">
          <span className="field-label !mb-0">Cantidad</span>
          <div className="inline-flex items-center rounded-full border border-line">
            <button type="button" className="h-11 w-11 inline-flex items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Disminuir cantidad">
              <IconMinus size={16} />
            </button>
            <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" className="h-11 w-11 inline-flex items-center justify-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(variant.stock, 20, q + 1))} disabled={qty >= Math.min(variant.stock, 20)} aria-label="Aumentar cantidad">
              <IconPlus size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Acciones */}
      <div ref={ctaRef} className="mt-8 grid gap-3">
        {productSoldOut ? (
          <>
            <button type="button" className="btn btn-primary w-full" onClick={askSoldOut}>
              <IconWhatsApp size={18} /> Avísame cuando llegue
            </button>
            <p className="text-center text-[13px] text-stone">Este producto está agotado por ahora.</p>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary w-full" onClick={buyWhatsApp}>
              <IconWhatsApp size={18} /> Comprar por WhatsApp
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={addToBag}>
              Agregar a la bolsa
            </button>
          </>
        )}
      </div>

      {/* CTA fijo en móvil */}
      {!productSoldOut ? (
        <div
          className={cn(
            "lg:hidden fixed inset-x-0 bottom-0 z-30 bg-ivory/95 backdrop-blur border-t border-line/80 px-4 pt-3 safe-bottom transition-transform duration-500",
            showSticky ? "translate-y-0" : "translate-y-full"
          )}
          aria-hidden={!showSticky}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] truncate">{product.name}</p>
              <Price price={product.price} size="sm" className="text-stone" />
            </div>
            <button type="button" tabIndex={showSticky ? 0 : -1} className="btn btn-primary btn-sm !min-h-[48px]" onClick={buyWhatsApp}>
              <IconWhatsApp size={16} /> {size ? `Talla ${size}` : "Comprar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
