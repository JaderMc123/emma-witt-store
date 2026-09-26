import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ShareButton } from "@/components/store/ShareButton";
import { ProductCard } from "@/components/store/ProductCard";
import { Price } from "@/components/ui/Price";
import { Reveal } from "@/components/ui/Reveal";
import { getProduct, getProducts, getSettings } from "@/services/catalog";
import { getSiteUrl } from "@/config/site";
import { totalStock } from "@/utils/catalog";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Producto no encontrado" };
  const img = p.images[0]?.url;
  const description = p.short_description || p.description?.slice(0, 155) || `${p.name} — Emma WITT Collection`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: p.name, description, type: "website", images: img ? [{ url: img, alt: p.name }] : undefined },
    twitter: { card: "summary_large_image", title: p.name, description, images: img ? [img] : undefined },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, settings, all] = await Promise.all([getProduct(slug), getSettings(), getProducts()]);
  if (!product) notFound();

  const related = all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);
  const more = related.length ? related : all.filter((p) => p.id !== product.id).slice(0, 4);
  const site = getSiteUrl();
  const inStock = totalStock(product) > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description || product.short_description || undefined,
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${site}${i.url}`)),
    brand: { "@type": "Brand", name: settings.store_name },
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site}/producto/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-4 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Ruta" className="mb-5 text-[11px] tracking-[0.16em] uppercase text-stone flex gap-2 flex-wrap">
        <Link href="/catalogo" className="hover:text-ink">Colección</Link>
        {product.category ? (
          <>
            <span aria-hidden>/</span>
            <Link href={`/categoria/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
          </>
        ) : null}
      </nav>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[108px] slide-up">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow">{product.category?.name || "Emma WITT"} · <span className="tabular-nums">{product.sku}</span></p>
              <ShareButton name={product.name} sku={product.sku} path={`/producto/${product.slug}`} storeName={settings.store_name} />
            </div>
            <h1 className="display text-[40px] sm:text-[52px] mt-3">{product.name}</h1>
            <Price price={product.price} compare={product.compare_price} size="lg" className="mt-4" />
            {product.short_description ? <p className="mt-5 text-[15px] leading-relaxed text-ink/80">{product.short_description}</p> : null}

            <ProductPurchase product={product} whatsapp={settings.whatsapp_number} storeName={settings.store_name} lowStock={settings.low_stock_threshold} />

            <div className="mt-10 border-t border-line/70">
              {product.description ? (
                <details className="group border-b border-line/70" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[11.5px] tracking-[0.2em] uppercase">
                    Descripción <span className="transition-transform duration-500 group-open:rotate-45 text-[18px] leading-none">+</span>
                  </summary>
                  <p className="pb-6 text-[15px] leading-[1.8] text-ink/80 whitespace-pre-line">{product.description}</p>
                </details>
              ) : null}
              <details className="group border-b border-line/70">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[11.5px] tracking-[0.2em] uppercase">
                  Envíos y cambios <span className="transition-transform duration-500 group-open:rotate-45 text-[18px] leading-none">+</span>
                </summary>
                <p className="pb-6 text-[15px] leading-[1.8] text-ink/80">
                  Enviamos a toda Colombia; el costo se calcula según tu ciudad antes de confirmar. Conoce nuestra{" "}
                  <Link href="/envios" className="underline underline-offset-4">política de envíos</Link> y de{" "}
                  <Link href="/cambios-y-devoluciones" className="underline underline-offset-4">cambios y devoluciones</Link>.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {more.length ? (
        <section className="pt-24 sm:pt-36" aria-labelledby="relacionados">
          <Reveal className="mb-8 sm:mb-12">
            <p className="eyebrow mb-3">También te puede gustar</p>
            <h2 id="relacionados" className="display text-[34px] sm:text-[48px]">Completa tu estilo</h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-6">
            {more.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
