export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rtjqriybonbwistfajyz.supabase.co";

// Clave pública (anon). Es segura en el navegador: el acceso real lo controla Row Level Security.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0anFyaXlib25id2lzdGZhanl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDE0NTAsImV4cCI6MjEwNjAxNzQ1MH0.nA_UkXQ7Ocww_uedYsRIvLBDKe4SS2KQyDaDVfnC6cM";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Emma WITT Collection",
  shortName: "Emma WITT",
  tagline: "Elegancia que camina contigo.",
  description:
    "Calzado femenino elegante y atemporal. Flats, sandalias, tacones y más, diseñados para acompañarte todos los días.",
  locale: "es_CO",
};

export const CATALOG_TAG = "catalog";
export const REVALIDATE_SECONDS = 60;

export const ORDER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "pagado", label: "Pagado" },
  { value: "preparando", label: "Preparando" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const SOLD_STATUSES = ["confirmado", "pagado", "preparando", "enviado", "entregado"];

export const LEGAL_SLUGS = [
  { slug: "terminos", path: "/terminos", label: "Términos y condiciones" },
  { slug: "privacidad", path: "/privacidad", label: "Política de privacidad" },
  { slug: "cookies", path: "/cookies", label: "Política de cookies" },
  { slug: "tratamiento-de-datos", path: "/tratamiento-de-datos", label: "Tratamiento de datos" },
  { slug: "envios", path: "/envios", label: "Envíos" },
  { slug: "cambios-y-devoluciones", path: "/cambios-y-devoluciones", label: "Cambios y devoluciones" },
] as const;

export const DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas",
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía",
  "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander",
  "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
  "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];
