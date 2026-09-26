"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { IconClose, IconMenu } from "@/components/ui/Icons";
import { ToastProvider } from "./ui";
import { browserClient } from "@/lib/supabase/browser";
import { cn } from "@/utils/format";

const NAV: { href: string; label: string; children?: { href: string; label: string }[] }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Catálogo", children: [{ href: "/admin/productos", label: "Productos" }, { href: "/admin/categorias", label: "Categorías" }] },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/envios", label: "Envíos" },
  { href: "/admin/configuracion/pagos", label: "Pagos" },
  { href: "/admin/legal", label: "Legal" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : href === "/admin/configuracion" ? pathname === href : pathname.startsWith(href));

  const signOut = async () => {
    await browserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav aria-label="Administración" className="flex flex-col gap-0.5">
      {NAV.map((item) =>
        item.children ? (
          <div key={item.label} className="py-1">
            <p className="px-4 pt-3 pb-1.5 text-[10px] tracking-[0.24em] uppercase text-stone">{item.label}</p>
            {item.children.map((c) => (
              <Link key={c.href} href={c.href} className={cn("block rounded-full px-4 py-2.5 text-[14px] transition", isActive(c.href) ? "bg-ink text-ivory" : "hover:bg-mist")}>
                {c.label}
              </Link>
            ))}
          </div>
        ) : (
          <Link key={item.href} href={item.href} className={cn("block rounded-full px-4 py-2.5 text-[14px] transition", isActive(item.href) ? "bg-ink text-ivory" : "hover:bg-mist")}>
            {item.label}
          </Link>
        )
      )}
    </nav>
  );

  const footer = (
    <div className="mt-auto pt-6 border-t border-line/70">
      <p className="px-4 text-[12px] text-stone truncate" title={email}>{email}</p>
      <div className="mt-3 flex flex-col gap-0.5">
        <Link href="/admin/cuenta" className="px-4 py-2 rounded-full text-[13px] hover:bg-mist">Mi cuenta</Link>
        <a href="/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[13px] hover:bg-mist">Ver tienda ↗</a>
        <button type="button" onClick={signOut} className="text-left px-4 py-2 rounded-full text-[13px] hover:bg-mist">Cerrar sesión</button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:flex flex-col sticky top-0 h-dvh border-r border-line/70 bg-paper px-3 py-7">
          <Link href="/admin" className="px-4 mb-8 block">
            <Logo size="sm" />
            <span className="block mt-2 text-[10px] tracking-[0.3em] uppercase text-stone">Administración</span>
          </Link>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {footer}
        </aside>

        <div className="lg:hidden sticky top-0 z-40 h-16 bg-paper/95 backdrop-blur border-b border-line/70 px-3 flex items-center justify-between">
          <button type="button" className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-mist" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <IconMenu size={22} />
          </button>
          <Link href="/admin"><Logo size="sm" /></Link>
          <span className="w-11" />
        </div>

        <div className={cn("lg:hidden fixed inset-0 z-50 transition-opacity duration-300", open ? "opacity-100" : "pointer-events-none opacity-0")}>
          <div className="absolute inset-0 bg-ink/20" onClick={() => setOpen(false)} />
          <div className={cn("absolute inset-y-0 left-0 w-[290px] bg-paper flex flex-col px-3 py-5 transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
            <div className="flex items-center justify-between px-2 mb-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone px-2">Administración</span>
              <button type="button" className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-mist" onClick={() => setOpen(false)} aria-label="Cerrar menú">
                <IconClose size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </div>
        </div>

        <main className="min-w-0 px-4 sm:px-8 lg:px-12 py-8 sm:py-12 max-w-[1280px] w-full">{children}</main>
      </div>
    </ToastProvider>
  );
}
