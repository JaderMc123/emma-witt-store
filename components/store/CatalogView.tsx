import { Suspense } from "react";
import { CatalogControls } from "./CatalogControls";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, ProductFull } from "@/types";
import { applyFilters, facets, type CatalogFilters } from "@/utils/catalog";

export function CatalogView({
  eyebrow,
  title,
  description,
  products,
  categories,
  filters,
  activeCategory,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  products: ProductFull[];
  categories: Category[];
  filters: CatalogFilters;
  activeCategory?: string;
}) {
  const scoped = activeCategory ? products.filter((p) => p.category?.slug === activeCategory) : products;
  const result = applyFilters(scoped, filters);
  const f = facets(scoped);
  const filtered = Boolean(filters.q || filters.talla?.length || filters.color?.length || filters.max || filters.disponible || filters.ofertas);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-10 sm:pt-16">
      <header className="mb-10 sm:mb-14 max-w-3xl slide-up">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="display text-[48px] sm:text-[76px]">{title}</h1>
        {description ? <p className="mt-4 text-stone text-[16px] leading-relaxed max-w-xl">{description}</p> : null}
      </header>

      <Suspense fallback={<div className="h-[44px]" />}>
        <CatalogControls
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          activeCategory={activeCategory}
          sizes={f.sizes}
          colors={f.colors}
          maxPrice={f.maxPrice}
          count={result.length}
        />
      </Suspense>

      {result.length ? (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-12 sm:gap-x-6 sm:gap-y-16">
          {result.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} className="fade-in" />
          ))}
        </div>
      ) : filtered ? (
        <EmptyState
          eyebrow={filters.q ? `“${filters.q}”` : "Sin resultados"}
          title="No encontramos ese par."
          text="Prueba con otros filtros o explora toda la colección."
          cta="Ver toda la colección"
          href={activeCategory ? `/categoria/${activeCategory}` : "/catalogo"}
        />
      ) : (
        <EmptyState
          eyebrow="Muy pronto"
          title="Estamos preparando algo especial."
          text="Esta categoría aún no tiene productos. Mientras tanto, descubre el resto de la colección."
          cta="Ver colección"
          href="/catalogo"
        />
      )}
    </div>
  );
}
