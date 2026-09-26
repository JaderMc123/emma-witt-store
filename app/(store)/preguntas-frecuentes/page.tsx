import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Preguntas frecuentes", alternates: { canonical: "/preguntas-frecuentes" } };

const FAQ = [
  { q: "¿Necesito crear una cuenta para comprar?", a: "No. Eliges tus productos, ingresas tus datos de envío y creas tu pedido. Luego lo confirmamos contigo por WhatsApp." },
  { q: "¿Cómo pago mi pedido?", a: "Una vez creado el pedido, te contactamos por WhatsApp para confirmar disponibilidad y coordinar el pago de forma segura." },
  { q: "¿Cuánto cuesta el envío?", a: "Depende de tu ciudad y se muestra antes de confirmar el pedido. En compras por encima del monto indicado en la tienda, el envío es gratis." },
  { q: "¿Cómo sé mi talla?", a: "Nuestras tallas son estándar colombianas. Si estás entre dos tallas, escríbenos y te asesoramos según el modelo." },
  { q: "¿Puedo cambiar mi producto?", a: "Sí, según nuestra política de cambios y devoluciones. El producto debe estar sin uso y en su empaque original." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-8 pt-10 sm:pt-16">
      <p className="eyebrow mb-4">Ayuda</p>
      <h1 className="display text-[48px] sm:text-[72px] mb-12">Preguntas frecuentes</h1>
      <div className="border-t border-line/70">
        {FAQ.map((f) => (
          <details key={f.q} className="group border-b border-line/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6">
              <span className="text-[17px]">{f.q}</span>
              <span className="text-[22px] leading-none transition-transform duration-500 group-open:rotate-45">+</span>
            </summary>
            <p className="pb-7 text-[15px] leading-[1.8] text-ink/75 max-w-2xl">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-12 text-stone">
        ¿Otra pregunta? <Link href="/contacto" className="underline underline-offset-4 text-ink">Contáctanos</Link>.
      </p>
    </div>
  );
}
