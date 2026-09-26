import type { ProductFull } from "@/types";

export type CatalogFilters = {
  q?: string;
  categoria?: string;
  talla?: string[];
  color?: string[];
  min?: number;
  max?: number;
  disponible?: boolean;
  ofertas?: boolean;
  orden?: "destacados" | "recientes" | "precio-asc" | "precio-desc";
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const arr = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(",") : []).filter(Boolean);
  const num = (v: string | string[] | undefined) => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const orden = one(sp.orden) as CatalogFilters["orden"];
  return {
    q: one(sp.q)?.slice(0, 60),
    categoria: one(sp.categoria),
    talla: arr(sp.talla),
    color: arr(sp.color),
    min: num(sp.min),
    max: num(sp.max),
    disponible: one(sp.disponible) === "1",
    ofertas: one(sp.ofertas) === "1",
    orden: orden && ["destacados", "recientes", "precio-asc", "precio-desc"].includes(orden) ? orden : "destacados",
  };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function applyFilters(products: ProductFull[], f: CatalogFilters): ProductFull[] {
  let list = products.filter((p) => {
    if (f.categoria && p.category?.slug !== f.categoria) return false;
    if (f.q) {
      const hay = norm(`${p.name} ${p.sku} ${p.short_description || ""} ${p.category?.name || ""}`);
      if (!norm(f.q).split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    if (f.min && p.price < f.min) return false;
    if (f.max && p.price > f.max) return false;
    if (f.ofertas && !(p.compare_price && p.compare_price > p.price)) return false;
    const variants = p.variants.filter(
      (v) =>
        (!f.talla?.length || f.talla.includes(v.size)) &&
        (!f.color?.length || f.color.includes(v.color)) &&
        (!f.disponible || v.stock > 0)
    );
    if ((f.talla?.length || f.color?.length || f.disponible) && variants.length === 0) return false;
    return true;
  });
  switch (f.orden) {
    case "recientes":
      list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case "precio-asc":
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case "precio-desc":
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    default:
      list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || b.created_at.localeCompare(a.created_at));
  }
  return list;
}

export function facets(products: ProductFull[]) {
  const sizes = new Set<string>();
  const colors = new Map<string, string | null>();
  let maxPrice = 0;
  for (const p of products) {
    maxPrice = Math.max(maxPrice, p.price);
    for (const v of p.variants) {
      sizes.add(v.size);
      if (!colors.has(v.color)) colors.set(v.color, v.color_hex);
    }
  }
  const sortedSizes = [...sizes].sort((a, b) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b));
  return { sizes: sortedSizes, colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })), maxPrice };
}

export function totalStock(p: ProductFull) {
  return p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
}
