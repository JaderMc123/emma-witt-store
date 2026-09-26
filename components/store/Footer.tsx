import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from "@/components/ui/Icons";
import { CookiePreferencesLink } from "./CookieBanner";
import type { StoreSettings } from "@/types";
import { waLink } from "@/utils/format";

export function Footer({ settings }: { settings: StoreSettings }) {
  const socials = [
    settings.instagram_url && { href: settings.instagram_url, label: "Instagram", Icon: IconInstagram },
    settings.facebook_url && { href: settings.facebook_url, label: "Facebook", Icon: IconFacebook },
    settings.tiktok_url && { href: settings.tiktok_url, label: "TikTok", Icon: IconTikTok },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof IconInstagram }[];

  const col = "text-[11px] tracking-[0.24em] uppercase text-stone mb-5";
  const link = "text-[14px] hover:text-stone transition";

  return (
    <footer className="bg-paper border-t border-line/70 mt-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 pt-16 pb-10">
        <div className="flex flex-col items-center text-center pb-14 border-b border-line/70">
          <Logo size="lg" src={settings.logo_url} />
          <p className="display italic text-[22px] text-stone mt-6">{settings.tagline || "Elegancia que camina contigo."}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 py-14">
          <div>
            <p className={col}>Navegación</p>
            <ul className="space-y-3">
              <li><Link className={link} href="/">Inicio</Link></li>
              <li><Link className={link} href="/catalogo">Colección</Link></li>
              <li><Link className={link} href="/nosotros">Nosotros</Link></li>
              <li><Link className={link} href="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <p className={col}>Ayuda</p>
            <ul className="space-y-3">
              <li><Link className={link} href="/envios">Envíos</Link></li>
              <li><Link className={link} href="/cambios-y-devoluciones">Cambios y devoluciones</Link></li>
              <li><Link className={link} href="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            </ul>
          </div>
          <div>
            <p className={col}>Legal</p>
            <ul className="space-y-3">
              <li><Link className={link} href="/privacidad">Privacidad</Link></li>
              <li><Link className={link} href="/cookies">Cookies</Link></li>
              <li><Link className={link} href="/terminos">Términos</Link></li>
              <li><Link className={link} href="/tratamiento-de-datos">Tratamiento de datos</Link></li>
              <li><CookiePreferencesLink className={link} /></li>
            </ul>
          </div>
          <div>
            <p className={col}>Contacto</p>
            <ul className="space-y-3">
              <li>
                <a className={`${link} inline-flex items-center gap-2`} href={waLink(settings.whatsapp_number, `Hola ${settings.store_name} 👋`)} target="_blank" rel="noopener noreferrer">
                  <IconWhatsApp size={16} /> WhatsApp
                </a>
              </li>
              {settings.email ? <li><a className={link} href={`mailto:${settings.email}`}>{settings.email}</a></li> : null}
              {settings.business_hours ? <li className="text-[13px] text-stone">{settings.business_hours}</li> : null}
            </ul>
            {socials.length ? (
              <div className="flex gap-2 mt-6 -ml-2">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-mist transition">
                    <Icon size={19} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="pt-8 border-t border-line/70 flex flex-col sm:flex-row gap-3 justify-between text-[11px] tracking-[0.14em] uppercase text-stone">
          <p>© {new Date().getFullYear()} {settings.store_name}</p>
          <p>Hecho en Colombia · Precios en COP</p>
        </div>
      </div>
    </footer>
  );
}
