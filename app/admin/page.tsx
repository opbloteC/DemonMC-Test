import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/staff/dashboard";
import { getSessionUser } from "@/lib/auth";
import { canManageAccounts, isStaffRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!canManageAccounts(user.role)) redirect(isStaffRole(user.role) ? "/staff" : "/");

  return <Dashboard user={user} mode="admin" initialTab="accounts" />;
}
