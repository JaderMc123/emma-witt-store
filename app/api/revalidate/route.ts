import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAdminSession } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/config/site";

/** Publica al instante los cambios hechos en el admin (solo administradores). */
export async function POST() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
