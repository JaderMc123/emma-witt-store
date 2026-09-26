import { formatCOP } from "@/utils/format";

/** Barras simples (una serie) — solo cuando aportan: tendencia diaria de ventas. */
export function BarChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure>
      <div className="flex items-end gap-1 sm:gap-1.5" style={{ height }} role="img" aria-label={`Ventas por día, total ${formatCOP(total)}`}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1 h-full flex items-end">
            <div
              className="w-full rounded-t-[6px] bg-ink/85 group-hover:bg-[color:var(--accent,#C6A770)] transition-colors"
              style={{ height: `${Math.max(d.value ? 3 : 1, (d.value / max) * 100)}%`, opacity: d.value ? 1 : 0.15 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-full bg-ink text-ivory px-2.5 py-1 text-[11px] opacity-0 group-hover:opacity-100 transition tabular-nums z-10">
              {d.label}: {formatCOP(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-stone tabular-nums">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </figure>
  );
}
