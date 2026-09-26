"use client";

import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

export function NoAccess({ email }: { email: string }) {
  const router = useRouter();
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <p className="eyebrow mb-4">Acceso restringido</p>
      <h1 className="display text-[40px]">Esta cuenta no es administradora.</h1>
      <p className="text-stone mt-3">{email}</p>
      <button
        className="btn btn-primary mt-8"
        onClick={async () => {
          await browserClient().auth.signOut();
          router.replace("/admin/login");
          router.refresh();
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
