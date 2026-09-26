import { createClient } from "@supabase/supabase-js";
import { CATALOG_TAG, REVALIDATE_SECONDS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";

/** Cliente de solo lectura para Server Components (catálogo). Cacheado con ISR + tag. */
export function publicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOG_TAG] } } as RequestInit),
    },
  });
}

/** Cliente sin caché (pedidos, datos que cambian por usuario). */
export function freshClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
