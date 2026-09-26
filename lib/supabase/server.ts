import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";

export async function serverClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* llamado desde un Server Component: el middleware refresca la sesión */
        }
      },
    },
  });
}

export async function getAdminSession() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { user: null, isAdmin: false } as const;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { user: data.user, isAdmin: Boolean(isAdmin) } as const;
}
