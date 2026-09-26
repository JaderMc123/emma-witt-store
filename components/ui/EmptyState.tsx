import Link from "next/link";

export function EmptyState({ eyebrow, title, text, cta, href, onAction, actionLabel }: { eyebrow?: string; title: string; text?: string; cta?: string; href?: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-20 sm:py-28 px-6 fade-in">
      <span aria-hidden className="mb-8 block h-16 w-16 rounded-full border border-line" />
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2 className="display text-[34px] sm:text-[44px] max-w-xl">{title}</h2>
      {text ? <p className="mt-4 text-stone max-w-md leading-relaxed">{text}</p> : null}
      <div className="mt-9 flex flex-wrap gap-3 justify-center">
        {cta && href ? (
          <Link href={href} className="btn btn-primary">
            {cta}
          </Link>
        ) : null}
        {onAction && actionLabel ? (
          <button type="button" onClick={onAction} className="btn btn-outline">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
