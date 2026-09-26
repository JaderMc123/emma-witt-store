import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_SLUGS } from "@/config/site";
import { IconArrow } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Políticas", alternates: { canonical: "/politicas" } };

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-8 pt-10 sm:pt-16">
      <p className="eyebrow mb-4">Centro legal</p>
      <h1 className="display text-[48px] sm:text-[72px] mb-12">Políticas</h1>
      <ul className="border-t border-line/70">
        {[...LEGAL_SLUGS, { slug: "contacto", path: "/contacto", label: "Contacto" }].map((l) => (
          <li key={l.slug} className="border-b border-line/70">
            <Link href={l.path} className="group flex items-center justify-between py-6">
              <span className="display text-[26px] sm:text-[32px]">{l.label}</span>
              <IconArrow size={20} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
