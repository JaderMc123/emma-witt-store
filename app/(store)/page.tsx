import Link from "next/link";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrow, IconWhatsApp } from "@/components/ui/Icons";
import { getCategories, getProducts, getSettings } from "@/services/catalog";
import { waLink } from "@/utils/format";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, products, categories] = await Promise.all([getSettings(), getProducts(), getCategories()]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const latest = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const hasSale = products.some((p) => p.compare_price && p.compare_price > p.price);
  const heroImg = settings.hero_image_url || "/demo/hero.svg";
  const edImg = settings.editorial_image_url || "/demo/editorial.svg";

  const tiles = [
    ...categories.map((c) => ({ href: `/categoria/${c.slug}`, name: c.name, img: c.image_url })),
    { href: "/catalogo?orden=recientes", name: "Nuevos", img: latest[0]?.images[0]?.url || null },
    ...(hasSale ? [{ href: "/catalogo?ofertas=1", name: "Ofertas", img: null }] : []),
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-[1440px] px-4 sm:px-8 pt-3 sm:pt-6">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end">
          <div className="lg:col-span-5 order-2 lg:order-1 pb-2 lg:pb-16 slide-up">
            <p className="eyebrow mb-5">{settings.hero_eyebrow || "Nueva colección"}</p>
            <h1 className="display text-[46px] leading-[0.98] sm:text-[68px] lg:text-[84px]">
              {settings.hero_title || "Pasos que se quedan en la memoria."}
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-stone max-w-[420px]">
              {settings.hero_subtitle || "Calzado femenino diseñado para acompañarte con elegancia, todos los días."}
            </p>
            <div className="mt-9 flex items-center gap-5">
              <Link href="/catalogo" className="btn btn-primary">
                Descubrir colección <IconArrow size={16} />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 fade-in">
            <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[6/7] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImg} alt="Colección Emma WITT" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mt-16 sm:mt-24 border-y border-line/70 overflow-hidden py-5" aria-hidden>
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12 items-center">
              {[...categories.map((c) => c.name), "Hecho con intención", "Elegancia que camina contigo"].map((w, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-12">
                  <span className="display italic text-[26px] text-stone">{w}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* COLECCIÓN DESTACADA */}
      {featured.length ? (
        <section className="mx-auto max-w-[1440px] pt-20 sm:pt-28" aria-labelledby="destacados">
          <Reveal className="px-4 sm:px-8 flex items-end justify-between gap-6 mb-8 sm:mb-12">
            <div>
              <p className="eyebrow mb-3">Seleccionados</p>
              <h2 id="destacados" className="display text-[38px] sm:text-[54px]">Colección destacada</h2>
            </div>
            <Link href="/catalogo" className="hidden sm:inline-flex items-center gap-2 text-[11.5px] tracking-[0.2em] uppercase link-underline">
              Ver todo <IconArrow size={14} />
            </Link>
          </Reveal>
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar px-4 sm:px-8 pb-2">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="snap-start shrink-0 w-[72vw] sm:w-auto">
                <ProductCard product={p} priority={i < 2} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* CATEGORÍAS */}
      {tiles.length ? (
        <section className="mx-auto max-w-[1440px] pt-24 sm:pt-32" aria-labelledby="categorias">
          <Reveal className="px-4 sm:px-8 text-center mb-10 sm:mb-14">
            <p className="eyebrow mb-3">Explora</p>
            <h2 id="categorias" className="display text-[38px] sm:text-[54px]">Encuentra tu par</h2>
          </Reveal>
          <ul className="flex lg:justify-center gap-5 sm:gap-8 overflow-x-auto no-scrollbar px-4 sm:px-8 snap-x">
            {tiles.map((t, i) => (
              <li key={t.href} className="snap-start shrink-0">
                <Reveal delay={i * 60}>
                  <Link href={t.href} className="group flex flex-col items-center gap-4 w-[112px] sm:w-[150px]">
                    <span className="relative block h-[112px] w-[112px] sm:h-[150px] sm:w-[150px] rounded-full overflow-hidden bg-mist ring-1 ring-line/60 group-hover:ring-ink transition duration-500">
                      {t.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.img} alt="" loading="lazy" className="img-zoom h-full w-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center display italic text-[28px] text-stone">%</span>
                      )}
                    </span>
                    <span className="text-[11.5px] tracking-[0.2em] uppercase">{t.name}</span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* EDITORIAL */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-24 sm:pt-36">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <Reveal className="lg:col-span-6 lg:col-start-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={edImg} alt="Editorial Emma WITT" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <p className="eyebrow mb-6">Editorial · N.º 01</p>
            <h2 className="display text-[48px] sm:text-[72px] leading-[0.95]">
              {(settings.editorial_title || "Elegancia que camina contigo.").split(" ").map((w, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? "italic text-stone" : undefined}>
                  {w}{i < arr.length - 1 ? " " : ""}
                </span>
              ))}
            </h2>
            <p className="mt-8 text-[16px] leading-[1.8] text-ink/80 max-w-[440px]">
              {settings.editorial_text ||
                "Texturas tejidas, metales suaves y siluetas atemporales. Cada par está pensado para vestir el día a día con la calma de lo bien hecho."}
            </p>
            <Link href="/nosotros" className="mt-10 inline-flex items-center gap-3 text-[11.5px] tracking-[0.2em] uppercase link-underline">
              Nuestra historia <IconArrow size={14} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* RECIÉN LLEGADOS */}
      {latest.length ? (
        <section className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-24 sm:pt-36" aria-labelledby="nuevos">
          <Reveal className="flex items-end justify-between gap-6 mb-8 sm:mb-12">
            <div>
              <p className="eyebrow mb-3">Recién llegados</p>
              <h2 id="nuevos" className="display text-[38px] sm:text-[54px]">Lo nuevo</h2>
            </div>
            <Link href="/catalogo?orden=recientes" className="inline-flex items-center gap-2 text-[11.5px] tracking-[0.2em] uppercase link-underline">
              Ver más <IconArrow size={14} />
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-6">
            {latest.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* WHATSAPP */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-24 sm:pt-36">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-sand px-6 py-16 sm:py-24 text-center">
            <span aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-ink/10" />
            <span aria-hidden className="absolute -left-16 -bottom-28 h-64 w-64 rounded-full border border-ink/10" />
            <p className="eyebrow mb-5">Atención personalizada</p>
            <h2 className="display text-[36px] sm:text-[56px] max-w-2xl mx-auto">¿Dudas con tu talla? Hablemos.</h2>
            <p className="mt-5 text-stone max-w-md mx-auto leading-relaxed">
              Te asesoramos por WhatsApp para que elijas el par perfecto.
            </p>
            <a
              href={waLink(settings.whatsapp_number, `Hola ${settings.store_name} 👋 Quisiera asesoría con mi talla.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-9"
            >
              <IconWhatsApp size={18} /> Escribir por WhatsApp
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
