/** $189.900 — enteros COP, sin decimales. */
export function formatCOP(value: number | null | undefined): string {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type StockState = "disponible" | "ultimas" | "agotado";

export function stockState(stock: number, threshold = 3): StockState {
  if (stock <= 0) return "agotado";
  if (stock <= threshold) return "ultimas";
  return "disponible";
}

export const STOCK_LABEL: Record<StockState, string> = {
  disponible: "Disponible",
  ultimas: "Últimas unidades",
  agotado: "Agotado",
};

export function formatDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/** Normaliza un teléfono colombiano a formato internacional para wa.me */
export function waNumber(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

export function waLink(number: string | null | undefined, text: string): string {
  const n = waNumber(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
