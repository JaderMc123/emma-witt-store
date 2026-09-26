import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalPage, getSettings } from "@/services/catalog";
import { LEGAL_SLUGS } from "@/config/site";
import { fillLegalPlaceholders, renderMarkdown } from "@/utils/markdown";
import { formatDate } from "@/utils/format";

export async function LegalView({ slug }: { slug: string }) {
  const [page, settings] = await Promise.all([getLegalPage(slug), getSettings()]);
  if (!page) notFound();
  const html = renderMarkdown(fillLegalPlaceholders(page.content, settings));
  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8 pt-10 sm:pt-16 grid lg:grid-cols-12 gap-10 lg:gap-16">
      <aside className="lg:col-span-3 order-2 lg:order-1">
        <nav aria-label="Centro legal" className="lg:sticky lg:top-[108px]">
          <p className="eyebrow mb-5">Centro legal</p>
          <ul className="space-y-3 text-[14px]">
            {LEGAL_SLUGS.map((l) => (
              <li key={l.slug}>
                <Link href={l.path} className={l.slug === slug ? "text-ink" : "text-stone hover:text-ink transition"} aria-current={l.slug === slug ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li><Link href="/contacto" className="text-stone hover:text-ink transition">Contacto</Link></li>
          </ul>
        </nav>
      </aside>
      <article className="lg:col-span-8 lg:col-start-5 order-1 lg:order-2 slide-up">
        <p className="eyebrow mb-4">Actualizado el {formatDate(page.updated_at)}</p>
        <div className="prose-ewc" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}

export async function legalMetadata(slug: string) {
  const page = await getLegalPage(slug);
  return { title: page?.title || "Legal", alternates: { canonical: LEGAL_SLUGS.find((l) => l.slug === slug)?.path } };
}
