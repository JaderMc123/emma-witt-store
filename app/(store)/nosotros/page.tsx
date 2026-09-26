import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { getSettings } from "@/services/catalog";

export const revalidate = 60;
export const metadata: Metadata = { title: "Nosotros", description: "La historia detrás de Emma WITT Collection.", alternates: { canonical: "/nosotros" } };

export default async function AboutPage() {
  const s = await getSettings();
  const values = [
    { t: "Intención", d: "Cada detalle —un moño, una hebilla, un tejido— tiene una razón de ser." },
    { t: "Comodidad", d: "Elegancia que se puede llevar de la mañana a la noche." },
    { t: "Atemporal", d: "Piezas pensadas para durar más allá de una temporada." },
  ];
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-10 sm:pt-16">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
        <div className="lg:col-span-6 slide-up">
          <p className="eyebrow mb-5">Nosotros</p>
          <h1 className="display text-[52px] sm:text-[88px] leading-[0.95]">
            La elegancia no es ruido, <span className="italic text-stone">es intención.</span>
          </h1>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="text-[17px] leading-[1.85] text-ink/80 whitespace-pre-line">{s.about_text}</p>
        </div>
      </div>
      <div className="mt-20 sm:mt-28 aspect-[16/10] sm:aspect-[21/9] overflow-hidden rounded-[28px] bg-sand fade-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.editorial_image_url || "/demo/editorial.svg"} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mt-20 sm:mt-28 grid sm:grid-cols-3 gap-10 border-t border-line/70 pt-12">
        {values.map((v, i) => (
          <Reveal key={v.t} delay={i * 100}>
            <p className="display italic text-[40px] text-stone">0{i + 1}</p>
            <h2 className="mt-3 text-[12px] tracking-[0.22em] uppercase">{v.t}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{v.d}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-20 text-center">
        <Link href="/catalogo" className="btn btn-primary">Ver colección</Link>
      </div>
    </div>
  );
}
