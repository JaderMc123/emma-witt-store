"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconClose, IconFilter, IconSearch } from "@/components/ui/Icons";
import { cn, formatCOP } from "@/utils/format";

type Props = {
  categories: { name: string; slug: string }[];
  activeCategory?: string;
  sizes: string[];
  colors: { name: string; hex: string | null }[];
  maxPrice: number;
  count: number;
};

const SORTS = [
  { value: "destacados", label: "Destacados" },
  { value: "recientes", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export function CatalogControls({ categories, activeCategory, sizes, colors, maxPrice, count }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") || "");
  const searchRef = useRef<HTMLInputElement>(null);
  const showSearch = params.get("buscar") === "1" || Boolean(params.get("q"));

  useEffect(() => {
    if (params.get("buscar") === "1") searchRef.current?.focus();
  }, [params]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const update = (mut: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mut(next);
    next.delete("buscar");
    const qs = next.toString();
    const base = pathname || "/catalogo";
    start(() => router.replace(qs ? `${base}?${qs}` : base, { scroll: false }));
  };

  const toggleList = (key: string, value: string) =>
    update((p) => {
      const cur = (p.get(key) || "").split(",").filter(Boolean);
      const nxt = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      nxt.length ? p.set(key, nxt.join(",")) : p.delete(key);
    });

  const list = (key: string) => (params.get(key) || "").split(",").filter(Boolean);
  const activeCount = list("talla").length + list("color").length + (params.get("max") ? 1 : 0) + (params.get("disponible") ? 1 : 0) + (params.get("ofertas") ? 1 : 0);
  const priceSteps = [150000, 200000, 250000, 300000, 400000].filter((s) => s < maxPrice * 1.2);

  return (
    <>
      {showSearch ? (
        <form
          role="search"
          className="mb-6 relative"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => (q.trim() ? p.set("q", q.trim()) : p.delete("q")));
          }}
        >
          <IconSearch size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone" />
          <label htmlFor="catalog-search" className="sr-only">Buscar productos</label>
          <input
            id="catalog-search"
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar baletas, sandalias, EWC-001…"
            className="input !rounded-full !pl-12"
            enterKeyHint="search"
          />
        </form>
      ) : null}

      <div className="flex items-center gap-3">
        <nav aria-label="Categorías" className="flex-1 min-w-0 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link href="/catalogo" className="chip shrink-0 !min-h-[40px] text-[12px]" aria-pressed={!activeCategory && pathname === "/catalogo"}>
            Todo
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`} className="chip shrink-0 !min-h-[40px] text-[12px]" aria-pressed={activeCategory === c.slug}>
              {c.name}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => setOpen(true)} className="chip shrink-0 !min-h-[40px] text-[12px]" aria-haspopup="dialog">
          <IconFilter size={16} /> <span className="hidden sm:inline">Filtrar y ordenar</span>
          {activeCount ? <span className="ml-0.5 h-5 min-w-5 px-1.5 rounded-full bg-ink text-ivory text-[10px] leading-5">{activeCount}</span> : null}
        </button>
      </div>

      <p className={cn("mt-5 text-[12px] tracking-[0.12em] uppercase text-stone transition-opacity", pending && "opacity-50")} aria-live="polite">
        {count} {count === 1 ? "producto" : "productos"}
      </p>

      {/* Panel de filtros */}
      <div className={cn("fixed inset-0 z-50 transition-opacity duration-500", open ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!open}>
        <div className="absolute inset-0 bg-ink/20" onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtrar y ordenar"
          className={cn(
            "absolute bg-ivory flex flex-col transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)]",
            "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px] sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:max-h-none sm:rounded-none sm:rounded-l-[28px]",
            open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line/70">
            <p className="eyebrow !text-ink">Filtrar y ordenar</p>
            <button type="button" onClick={() => setOpen(false)} className="h-11 w-11 -mr-3 inline-flex items-center justify-center rounded-full hover:bg-mist" aria-label="Cerrar filtros">
              <IconClose size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-9">
            <fieldset>
              <legend className="field-label">Ordenar por</legend>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className="chip text-[12.5px]"
                    aria-pressed={(params.get("orden") || "destacados") === s.value}
                    onClick={() => update((p) => (s.value === "destacados" ? p.delete("orden") : p.set("orden", s.value)))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {sizes.length ? (
              <fieldset>
                <legend className="field-label">Talla</legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s} type="button" className="chip tabular-nums" aria-pressed={list("talla").includes(s)} onClick={() => toggleList("talla", s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {colors.length ? (
              <fieldset>
                <legend className="field-label">Color</legend>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button key={c.name} type="button" className="chip text-[12.5px]" aria-pressed={list("color").includes(c.name)} onClick={() => toggleList("color", c.name)}>
                      <span className="h-3.5 w-3.5 rounded-full ring-1 ring-line" style={{ background: c.hex || "#ccc" }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <fieldset>
              <legend className="field-label">Precio</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip text-[12.5px]" aria-pressed={!params.get("max")} onClick={() => update((p) => p.delete("max"))}>
                  Todos
                </button>
                {priceSteps.map((s) => (
                  <button key={s} type="button" className="chip text-[12.5px] tabular-nums" aria-pressed={params.get("max") === String(s)} onClick={() => update((p) => p.set("max", String(s)))}>
                    Hasta {formatCOP(s)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="field-label">Disponibilidad</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip text-[12.5px]" aria-pressed={params.get("disponible") === "1"} onClick={() => update((p) => (p.get("disponible") ? p.delete("disponible") : p.set("disponible", "1")))}>
                  Solo disponibles
                </button>
                <button type="button" className="chip text-[12.5px]" aria-pressed={params.get("ofertas") === "1"} onClick={() => update((p) => (p.get("ofertas") ? p.delete("ofertas") : p.set("ofertas", "1")))}>
                  En oferta
                </button>
              </div>
            </fieldset>
          </div>
          <div className="px-6 pt-4 border-t border-line/70 flex gap-3 safe-bottom">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={() =>
                update((p) => {
                  ["talla", "color", "max", "min", "disponible", "ofertas", "orden", "q"].forEach((k) => p.delete(k));
                })
              }
            >
              Limpiar
            </button>
            <button type="button" className="btn btn-primary flex-[1.4]" onClick={() => setOpen(false)}>
              Ver {count}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
