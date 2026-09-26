import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/hooks/useCart";
import { SITE, getSiteUrl } from "@/config/site";
import { getSettings } from "@/services/catalog";

const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.store_name || SITE.name;
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${name} — Calzado femenino`, template: `%s · ${name}` },
    description: SITE.description,
    applicationName: name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      siteName: name,
      title: `${name} — ${s.tagline || SITE.tagline}`,
      description: SITE.description,
      ...(s.hero_image_url ? { images: [{ url: s.hero_image_url }] } : {}),
    },
    twitter: { card: "summary_large_image", title: name, description: SITE.description },
    icons: s.favicon_url ? { icon: s.favicon_url } : { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#F7F4EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${jost.variable} ${cormorant.variable}`}>
      <body className="min-h-dvh">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
