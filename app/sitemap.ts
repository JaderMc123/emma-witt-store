import type { MetadataRoute } from "next";
import { getSiteUrl, LEGAL_SLUGS } from "@/config/site";
import { getCategories, getProducts } from "@/services/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const statics = ["", "/catalogo", "/nosotros", "/contacto", "/preguntas-frecuentes", "/politicas", ...LEGAL_SLUGS.map((l) => l.path)];
  return [
    ...statics.map((p) => ({ url: `${site}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...categories.map((c) => ({ url: `${site}/categoria/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${site}/producto/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
