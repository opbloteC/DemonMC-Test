import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/staff/dashboard";
import { getSessionUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Staff Panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/staff");
  if (!isStaffRole(user.role)) redirect("/");

  return <Dashboard user={user} />;
}
