import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";

export function AnnouncementCard({
  announcement,
  clamped = false,
}: {
  announcement: Announcement;
  clamped?: boolean;
}) {
  return (
    <article className="panel panel-hover group relative overflow-hidden p-6">
      <span className="absolute inset-y-5 left-0 w-px bg-gradient-to-b from-ember/0 via-ember/70 to-ember/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        <span className="h-1 w-1 rounded-full bg-ember/80" />
        {formatDate(announcement.createdAt)}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-white">
        {announcement.title}
      </h3>
      <p
        className={`mt-2.5 whitespace-pre-line text-sm leading-relaxed text-zinc-400 ${
          clamped ? "line-clamp-3" : ""
        }`}
      >
        {announcement.body}
      </p>
      <div className="mt-5">
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors group-hover:text-ember-bright"
        >
          Read on the announcements page
          <ArrowRightIcon width={13} height={13} />
        </Link>
      </div>
    </article>
  );
}
