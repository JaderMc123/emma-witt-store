"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { IconBag, IconClose, IconMenu, IconSearch, IconArrow } from "@/components/ui/Icons";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/format";

type NavCategory = { name: string; slug: string };

export function Header({ logoUrl, categories, announcement }: { logoUrl?: string | null; categories: NavCategory[]; announcement?: string | null }) {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nav = [
    { href: "/catalogo", label: "Colección" },
    { href: "/catalogo?orden=recientes", label: "Nuevos" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
  ];

  return (
    <>
      {announcement ? (
        <div className="bg-ink text-ivory text-[10.5px] tracking-[0.24em] uppercase text-center py-2.5 px-4">{announcement}</div>
      ) : null}
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled ? "bg-ivory/90 backdrop-blur-md border-b border-line/70" : "bg-ivory border-b border-transparent"
        )}
      >
        <div className="mx-auto max-w-[1440px] h-[68px] sm:h-[76px] px-4 sm:px-8 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lg:hidden -ml-2 h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-mist transition"
              aria-label="Abrir menú"
              aria-expanded={open}
            >
              <IconMenu size={22} />
            </button>
            <nav aria-label="Principal" className="hidden lg:flex items-center gap-8">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="link-underline text-[11.5px] tracking-[0.2em] uppercase" aria-current={pathname === n.href ? "page" : undefined}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" aria-label="Emma WITT Collection — inicio" className="px-2">
            <Logo src={logoUrl} />
          </Link>

          <div className="flex items-center justify-end gap-1">
            <Link href="/catalogo?buscar=1" className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-mist transition" aria-label="Buscar">
              <IconSearch size={20} />
            </Link>
            <Link href="/carrito" className="relative h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-mist transition" aria-label={`Bolsa de compras, ${count} productos`}>
              <IconBag size={21} />
              {ready && count > 0 ? (
                <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-ink text-ivory text-[9.5px] leading-[17px] text-center tabular-nums fade-in">
                  {count}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden transition-opacity duration-500", open ? "opacity-100" : "pointer-events-none opacity-0")}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-ink/20" onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className={cn(
            "absolute inset-y-0 left-0 w-full max-w-[420px] bg-ivory flex flex-col transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)]",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-[68px] px-4 flex items-center justify-between border-b border-line/70">
            <Logo size="sm" src={logoUrl} />
            <button type="button" onClick={() => setOpen(false)} className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-mist" aria-label="Cerrar menú">
              <IconClose size={22} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-6 pt-8 pb-10" aria-label="Menú móvil">
            <p className="eyebrow mb-5">Colección</p>
            <ul className="space-y-1">
              <li>
                <Link href="/catalogo" className="group flex items-center justify-between py-2.5 display text-[34px]">
                  Ver todo <IconArrow size={20} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categoria/${c.slug}`} className="block py-2.5 display text-[34px]">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/catalogo?ofertas=1" className="block py-2.5 display text-[34px] italic text-stone">
                  Ofertas
                </Link>
              </li>
            </ul>
            <div className="mt-10 pt-8 border-t border-line/70 grid gap-4 text-[12px] tracking-[0.2em] uppercase">
              <Link href="/nosotros">Nosotros</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/envios">Envíos</Link>
              <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
