"use client";

import { useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import type { CartItem, Quote } from "@/types";

/** Recalcula en el servidor precio, stock, subtotal y envío. Nunca confía en el navegador. */
export function useQuote(items: CartItem[], ready: boolean, city?: string, department?: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const seq = useRef(0);
  const key = JSON.stringify(items.map((i) => [i.variantId, i.quantity])) + `|${city || ""}|${department || ""}`;

  useEffect(() => {
    if (!ready) return;
    if (!items.length) {
      setQuote(null);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data, error } = await browserClient().rpc("quote_cart", {
        p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        p_city: city?.trim() || null,
        p_department: department || null,
      });
      if (id !== seq.current) return;
      setLoading(false);
      if (error) {
        setError(true);
        return;
      }
      setError(false);
      setQuote(data as Quote);
    }, city !== undefined ? 450 : 50);
    return () => clearTimeout(t);
  }, [key, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quote, loading, error };
}
