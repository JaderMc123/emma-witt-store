import { cn } from "@/utils/format";

/** Wordmark tipográfico fiel al logo: EMMA WITT sobre COLLECTION, espaciado amplio. */
export function Logo({ src, className, size = "md", alt = "Emma WITT Collection" }: { src?: string | null; className?: string; size?: "sm" | "md" | "lg"; alt?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn(size === "lg" ? "h-16" : size === "sm" ? "h-8" : "h-10", "w-auto object-contain", className)} />;
  }
  const main = size === "lg" ? "text-[34px] sm:text-[44px]" : size === "sm" ? "text-[15px]" : "text-[19px] sm:text-[21px]";
  const sub = size === "lg" ? "text-[11px] sm:text-[13px] mt-2" : size === "sm" ? "text-[6.5px] mt-[3px]" : "text-[7.5px] sm:text-[8px] mt-[5px]";
  return (
    <span className={cn("inline-flex flex-col items-center leading-none select-none", className)} aria-label={alt} role="img">
      <span className={cn(main, "font-sans font-normal tracking-[0.26em] pl-[0.26em] text-ink")}>EMMA WITT</span>
      <span className={cn(sub, "font-sans font-normal tracking-[0.5em] pl-[0.5em] text-stone")}>COLLECTION</span>
    </span>
  );
}
