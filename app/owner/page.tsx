import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/staff/dashboard";
import { getSessionUser } from "@/lib/auth";
import { canManageAccounts, isStaffRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Owner console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/owner");
  if (user.role !== "owner") {
    redirect(canManageAccounts(user.role) ? "/admin" : isStaffRole(user.role) ? "/staff" : "/");
  }

  return (
    <Dashboard
      user={user}
      mode="owner"
      initialTab="accounts"
      tabs={["overview", "accounts", "settings", "account"]}
    />
  );
}
