"use client";

import { EmptyState } from "@/components/ui/EmptyState";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return <EmptyState eyebrow="Ups" title="Algo no salió como esperábamos." text="Por favor intenta de nuevo en un momento." onAction={reset} actionLabel="Intentar nuevamente" cta="Ir al inicio" href="/" />;
}
