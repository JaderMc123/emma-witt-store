import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CookieBanner } from "@/components/store/CookieBanner";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";
import { AddedToast } from "@/components/store/AddedToast";
import { getCategories, getSettings, getShippingConfig } from "@/services/catalog";
import { formatCOP } from "@/utils/format";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, shipping] = await Promise.all([getSettings(), getCategories(), getShippingConfig()]);
  const announcement =
    shipping?.free_shipping_enabled && shipping.free_shipping_threshold > 0
      ? `Envío gratis en compras desde ${formatCOP(shipping.free_shipping_threshold)}`
      : "Envíos a toda Colombia";

  return (
    <div style={{ ["--accent" as string]: settings.accent_color || "#C6A770" }}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-ink focus:text-ivory focus:px-4 focus:py-2 focus:rounded-full">
        Saltar al contenido
      </a>
      <Header logoUrl={settings.logo_url} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} announcement={announcement} />
      <main id="contenido">{children}</main>
      <Footer settings={settings} />
      <AddedToast />
      <WhatsAppFloat number={settings.whatsapp_number} storeName={settings.store_name} />
      <CookieBanner />
    </div>
  );
}
