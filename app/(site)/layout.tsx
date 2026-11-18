import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} user={user} />
    </div>
  );
}
