import { cn, formatCOP } from "@/utils/format";

export function Price({ price, compare, className, size = "md" }: { price: number; compare?: number | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const onSale = compare && compare > price;
  return (
    <span className={cn("inline-flex items-baseline gap-2.5 tabular-nums", className)}>
      <span className={cn(size === "lg" ? "text-[22px]" : size === "sm" ? "text-[13px]" : "text-[15px]", "tracking-[0.02em]")}>
        {formatCOP(price)}
      </span>
      {onSale ? (
        <>
          <span className={cn(size === "lg" ? "text-[15px]" : "text-[12px]", "text-stone line-through")}>
            <span className="sr-only">Antes </span>
            {formatCOP(compare!)}
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase text-[color:var(--accent)]">
            −{Math.round((1 - price / compare!) * 100)}%
          </span>
        </>
      ) : null}
    </span>
  );
}
