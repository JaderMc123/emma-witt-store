"use client";

import { useRef, useState } from "react";
import type { ProductImage } from "@/types";
import { cn } from "@/utils/format";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  if (!images.length) {
    return <div className="aspect-[4/5] rounded-[24px] bg-mist" aria-label="Sin imagen" />;
  }

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Móvil: carrusel a sangre */}
      <div className="lg:hidden -mx-4 relative">
        <div ref={scroller} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar" aria-roledescription="carrusel" aria-label={`Imágenes de ${name}`}>
          {images.map((img, i) => (
            <div key={img.id} className="snap-center shrink-0 w-full px-4">
              <div className="aspect-[4/5] overflow-hidden rounded-[24px] bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || `${name} — imagen ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="flex justify-center gap-1.5 mt-4" aria-hidden>
            {images.map((img, i) => (
              <span key={img.id} className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-6 bg-ink" : "w-1.5 bg-line")} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: composición editorial */}
      <div className="hidden lg:grid grid-cols-2 gap-4">
        {images.map((img, i) => (
          <div key={img.id} className={cn("overflow-hidden rounded-[24px] bg-mist fade-in", i === 0 ? "col-span-2 aspect-[5/5.4]" : "aspect-[4/5]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt || `${name} — imagen ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </>
  );
}
