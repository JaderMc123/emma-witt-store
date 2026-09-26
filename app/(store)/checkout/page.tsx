"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArrowLeft } from "@/components/ui/Icons";
import { useCart } from "@/hooks/useCart";
import { useQuote } from "@/hooks/useQuote";
import { browserClient } from "@/lib/supabase/browser";
import { DEPARTMENTS } from "@/config/site";
import type { PaymentMethod } from "@/types";
import { cn, formatCOP } from "@/utils/format";

const ERRORS: Record<string, string> = {
  TERMS_REQUIRED: "Debes aceptar los términos y la política de privacidad.",
  INVALID_NAME: "Escribe tu nombre completo.",
  INVALID_PHONE: "Revisa tu número de teléfono.",
  INVALID_EMAIL: "Revisa tu correo electrónico.",
  INVALID_ADDRESS: "Completa departamento, ciudad y dirección.",
  INVALID_PAYMENT_METHOD: "Elige un método de pago disponible.",
  EMPTY_CART: "Tu bolsa está vacía.",
  VARIANT_UNAVAILABLE: "Uno de tus productos ya no está disponible. Revisa tu bolsa.",
  OUT_OF_STOCK: "Uno de tus productos se agotó mientras comprabas. Revisa tu bolsa.",
  NO_SHIPPING: "Por ahora no enviamos a esa ciudad. Escríbenos por WhatsApp.",
};

type Form = { name: string; phone: string; email: string; department: string; city: string; address: string; neighborhood: string; notes: string };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [form, setForm] = useState<Form>({ name: "", phone: "", email: "", department: "", city: "", address: "", neighborhood: "", notes: "" });
  const [accepted, setAccepted] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [method, setMethod] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { quote, loading } = useQuote(items, ready, form.city, form.department);

  useEffect(() => {
    browserClient()
      .from("payment_methods")
      .select("*")
      .eq("enabled", true)
      .order("sort_order")
      .then(({ data }) => {
        const list = ((data as PaymentMethod[]) || []).filter((m) => ["whatsapp", "transfer", "cod"].includes(m.id));
        setMethods(list);
        if (list.length && !list.find((m) => m.id === "whatsapp")) setMethod(list[0].id);
      });
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const invalid = {
    name: form.name.trim().length < 3,
    phone: form.phone.replace(/\D/g, "").length < 7,
    email: form.email.trim() !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()),
    department: !form.department,
    city: form.city.trim().length < 2,
    address: form.address.trim().length < 5,
  };
  const formInvalid = Object.values(invalid).some(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (formInvalid) {
      setError("Revisa los campos marcados.");
      return;
    }
    if (!accepted) {
      setError(ERRORS.TERMS_REQUIRED);
      return;
    }
    setSubmitting(true);
    const { data, error } = await browserClient().rpc("create_order", {
      p: {
        customer: { name: form.name, phone: form.phone, email: form.email },
        shipping: { department: form.department, city: form.city, address: form.address, neighborhood: form.neighborhood, notes: form.notes },
        items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        payment_method: method,
        terms_accepted: accepted,
        privacy_accepted: accepted,
      },
    });
    if (error || !data) {
      const code = Object.keys(ERRORS).find((k) => error?.message?.includes(k));
      setError(code ? ERRORS[code] : "Algo no salió como esperábamos. Intenta nuevamente.");
      setSubmitting(false);
      return;
    }
    const res = data as { token: string };
    clear();
    router.replace(`/pedido/${res.token}?nuevo=1`);
  };

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!items.length && !submitting) {
    return <EmptyState eyebrow="Checkout" title="Tu bolsa está vacía." text="Agrega productos para finalizar tu pedido." cta="Ver colección" href="/catalogo" />;
  }

  const err = (k: keyof typeof invalid) => touched && invalid[k];
  const shipping = quote?.shipping_cost;

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8 pt-8 sm:pt-14">
      <Link href="/carrito" className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-stone hover:text-ink mb-8">
        <IconArrowLeft size={15} /> Volver a la bolsa
      </Link>
      <h1 className="display text-[44px] sm:text-[64px] mb-10 slide-up">Finalizar pedido</h1>

      <form onSubmit={submit} noValidate className="grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7 space-y-12">
          <section aria-labelledby="contacto">
            <h2 id="contacto" className="eyebrow !text-ink mb-6">1 · Contacto</h2>
            <div className="grid gap-5">
              <div>
                <label className="field-label" htmlFor="name">Nombre completo</label>
                <input id="name" className="input" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={err("name")} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="field-label" htmlFor="phone">Teléfono / WhatsApp</label>
                  <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" value={form.phone} onChange={set("phone")} aria-invalid={err("phone")} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Email <span className="normal-case tracking-normal">(opcional)</span></label>
                  <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={err("email")} />
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="envio">
            <h2 id="envio" className="eyebrow !text-ink mb-6">2 · Dirección de envío</h2>
            <div className="grid gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="field-label" htmlFor="department">Departamento</label>
                  <select id="department" className="input" autoComplete="address-level1" value={form.department} onChange={set("department")} aria-invalid={err("department")} required>
                    <option value="">Selecciona…</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="city">Ciudad</label>
                  <input id="city" className="input" autoComplete="address-level2" value={form.city} onChange={set("city")} aria-invalid={err("city")} required />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="address">Dirección</label>
                <input id="address" className="input" autoComplete="street-address" placeholder="Calle 00 # 00-00, apto 000" value={form.address} onChange={set("address")} aria-invalid={err("address")} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="field-label" htmlFor="neighborhood">Barrio</label>
                  <input id="neighborhood" className="input" value={form.neighborhood} onChange={set("neighborhood")} />
                </div>
                <div>
                  <label className="field-label" htmlFor="notes">Referencia <span className="normal-case tracking-normal">(opcional)</span></label>
                  <input id="notes" className="input" placeholder="Torre, portería, indicaciones" value={form.notes} onChange={set("notes")} />
                </div>
              </div>
            </div>
          </section>

          {methods.length > 1 ? (
            <section aria-labelledby="pago">
              <h2 id="pago" className="eyebrow !text-ink mb-6">3 · Método de pago</h2>
              <div className="grid gap-3" role="radiogroup">
                {methods.map((m) => (
                  <label key={m.id} className={cn("flex gap-4 items-start rounded-[18px] border p-5 cursor-pointer transition", method === m.id ? "border-ink bg-paper" : "border-line hover:border-stone")}>
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-[#111]" />
                    <span>
                      <span className="block text-[15px]">{m.name}</span>
                      {m.description ? <span className="block text-[13px] text-stone mt-1">{m.description}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-[108px] rounded-[24px] bg-paper border border-line/70 p-6 sm:p-8">
            <p className="eyebrow mb-6 !text-ink">Tu pedido</p>
            <ul className="space-y-4 mb-6">
              {items.map((i) => {
                const line = quote?.lines.find((l) => l.variant_id === i.variantId);
                return (
                  <li key={i.variantId} className="flex gap-3.5 items-center">
                    <div className="relative h-16 w-[52px] rounded-xl bg-mist overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : null}
                      <span className="absolute -top-0 -right-0 h-5 min-w-5 px-1 rounded-bl-lg bg-ink text-ivory text-[10px] leading-5 text-center tabular-nums">{i.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] truncate">{i.name}</p>
                      <p className="text-[12px] text-stone">{i.color} · T{i.size}</p>
                      {line && !line.available ? <p className="text-[12px] text-danger">No disponible</p> : null}
                    </div>
                    <p className="text-[13.5px] tabular-nums">{formatCOP((line?.unit_price ?? i.price) * i.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className={cn("space-y-3 text-[14px] border-t border-line/70 pt-5 transition-opacity", loading && "opacity-60")}>
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatCOP(quote?.subtotal ?? 0)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-stone">Envío</dt>
                <dd className="tabular-nums">
                  {!form.city.trim() || !form.department ? <span className="text-stone">Ingresa tu ciudad</span> : shipping === null || shipping === undefined ? <span className="text-stone">—</span> : shipping === 0 ? "Gratis" : formatCOP(shipping)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-line/70 text-[17px]"><dt>Total</dt><dd className="tabular-nums">{formatCOP(quote?.total ?? 0)}</dd></div>
            </dl>

            <label className="mt-7 flex gap-3 items-start text-[13px] leading-relaxed cursor-pointer">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#111]" aria-invalid={touched && !accepted} required />
              <span>
                Acepto los <Link href="/terminos" target="_blank" className="underline underline-offset-4">términos y condiciones</Link> y la{" "}
                <Link href="/privacidad" target="_blank" className="underline underline-offset-4">política de privacidad</Link>.
              </span>
            </label>

            {error ? <p className="mt-5 text-[13px] text-danger" role="alert">{error}</p> : null}

            <button type="submit" className="btn btn-primary w-full mt-6" disabled={submitting || (quote ? !quote.valid : true)}>
              {submitting ? "Creando pedido…" : "Confirmar pedido"}
            </button>
            <p className="mt-4 text-center text-[12px] text-stone leading-relaxed">
              No cobramos nada ahora. Al confirmar, continuamos contigo por WhatsApp.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
