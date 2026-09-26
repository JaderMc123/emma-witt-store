import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/supabase/server";
import { NoAccess } from "@/components/admin/NoAccess";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getAdminSession();
  if (!user) redirect("/admin/login");
  if (!isAdmin) return <NoAccess email={user.email || ""} />;
  return <AdminShell email={user.email || ""}>{children}</AdminShell>;
}
