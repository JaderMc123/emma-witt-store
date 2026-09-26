import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return <EmptyState eyebrow="404" title="Este par se nos escapó." text="La página que buscas no existe o fue movida." cta="Ver la colección" href="/catalogo" />;
}
