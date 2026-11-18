import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffLoginRedirect() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/staff");
  redirect(isStaffRole(user.role) ? "/staff" : "/");
}
