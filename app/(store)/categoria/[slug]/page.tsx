import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/store/CatalogView";
import { getCategories, getCategory, getProducts } from "@/services/catalog";
import { parseFilters } from "@/utils/catalog";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: "Categoría no encontrada" };
  return {
    title: c.name,
    description: c.description || `${c.name} — calzado femenino Emma WITT Collection.`,
    alternates: { canonical: `/categoria/${c.slug}` },
    openGraph: c.image_url ? { images: [{ url: c.image_url }] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [category, products, categories] = await Promise.all([getCategory(slug), getProducts(), getCategories()]);
  if (!category) notFound();
  return (
    <CatalogView
      eyebrow="Categoría"
      title={category.name}
      description={category.description}
      products={products}
      categories={categories}
      filters={parseFilters(sp)}
      activeCategory={category.slug}
    />
  );
}
