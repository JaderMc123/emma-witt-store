import Link from "next/link";
import { Price } from "@/components/ui/Price";
import type { ProductFull } from "@/types";
import { totalStock } from "@/utils/catalog";
import { cn } from "@/utils/format";

export function ProductCard({ product, priority = false, className }: { product: ProductFull; priority?: boolean; className?: string }) {
  const [main, alt] = product.images;
  const soldOut = totalStock(product) === 0;
  const onSale = product.compare_price && product.compare_price > product.price;
  const colors = Array.from(new Map(product.variants.map((v) => [v.color, v.color_hex])).entries());

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/producto/${product.slug}`} className="block" aria-label={`${product.name}, ver producto`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-mist">
          {main ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={main.url}
              alt={main.alt || product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={cn("img-zoom absolute inset-0 h-full w-full object-cover", alt && "transition-opacity duration-700 group-hover:opacity-0")}
            />
          ) : null}
          {alt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={alt.url} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          ) : null}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {soldOut ? (
              <span className="rounded-full bg-paper/90 backdrop-blur px-3 py-1.5 text-[9.5px] tracking-[0.2em] uppercase">Agotado</span>
            ) : onSale ? (
              <span className="rounded-full bg-paper/90 backdrop-blur px-3 py-1.5 text-[9.5px] tracking-[0.2em] uppercase">Oferta</span>
            ) : null}
          </div>
        </div>
        <div className="pt-4 px-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[14px] leading-snug tracking-[0.01em]">{product.name}</h3>
            {colors.length > 1 ? (
              <span className="flex -space-x-1 pt-1 shrink-0" aria-label={`${colors.length} colores`}>
                {colors.slice(0, 4).map(([name, hex]) => (
                  <span key={name} title={name} className="h-3 w-3 rounded-full border border-paper ring-1 ring-line" style={{ background: hex || "#ccc" }} />
                ))}
              </span>
            ) : null}
          </div>
          <Price price={product.price} compare={product.compare_price} className="mt-1.5 text-stone" size="sm" />
        </div>
      </Link>
    </article>
  );
}
