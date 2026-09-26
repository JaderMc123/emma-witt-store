import type { Metadata } from "next";
import { CatalogView } from "@/components/store/CatalogView";
import { getCategories, getProducts } from "@/services/catalog";
import { parseFilters } from "@/utils/catalog";

export const metadata: Metadata = {
  title: "Colección",
  description: "Descubre toda la colección de calzado femenino Emma WITT: flats, sandalias, tacones y más.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const title = filters.ofertas ? "Ofertas" : filters.orden === "recientes" ? "Lo nuevo" : "La colección";
  return <CatalogView eyebrow="Emma WITT Collection" title={title} products={products} categories={categories} filters={filters} />;
}
