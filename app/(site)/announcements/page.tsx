import type { Metadata } from "next";
import { AnnouncementCard } from "@/components/announcement-card";
import { MegaphoneIcon } from "@/components/icons";
import { listAnnouncements } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Announcements",
  description: "News, updates and events from the DemonMC network.",
};

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <>
      <section className="border-b border-white/[0.05]">
        <div className="container-x py-14 sm:py-16">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-ember/70" />
            News
          </p>
          <h1 className="headline mt-3 text-4xl sm:text-5xl">Announcements</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Everything the network wants you to know — updates, events and important notices.
          </p>
        </div>
      </section>

      <section className="container-x pb-24 pt-10">
        {announcements.length === 0 ? (
          <div className="panel flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500">
              <MegaphoneIcon width={20} height={20} />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              No announcements yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              When DemonMC publishes news, it will appear here and on the homepage.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
