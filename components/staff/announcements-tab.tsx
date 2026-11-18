"use client";

import { useCallback, useEffect, useState } from "react";
import { MegaphoneIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import {
  apiRequest,
  ConfirmDialog,
  EmptyState,
  ErrorNote,
  errorMessage,
  Field,
  Modal,
  PageSectionHeader,
  Spinner,
  type Notify,
} from "./ui";

function AnnouncementEditor({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await apiRequest(
        announcement ? `/api/admin/announcements/${announcement.id}` : "/api/admin/announcements",
        {
          method: announcement ? "PATCH" : "POST",
          body: { title, body },
        },
      );
      onSaved(announcement ? "edit" : "create");
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <Modal
      title={announcement ? "Edit announcement" : "New announcement"}
      description="Announcements appear on the homepage and the announcements page."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="announcement-title" hint="3–120 characters.">
          <input
            id="announcement-title"
            className="input"
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Season 2 is live"
          />
        </Field>

        <Field label="Announcement" htmlFor="announcement-body" hint="3–2000 characters.">
          <textarea
            id="announcement-body"
            rows={7}
            required
            minLength={3}
            maxLength={2000}
            className="input resize-y"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write the announcement here…"
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost !py-2.5 text-xs" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-xs">
            {pending ? "Saving…" : announcement ? "Save changes" : "Publish announcement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AnnouncementsTab({ isOwner, notify }: { isOwner: boolean; notify: Notify }) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState<
    { mode: "create" } | { mode: "edit"; announcement: Announcement } | null
  >(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const data = await apiRequest<{ announcements: Announcement[] }>("/api/admin/announcements");
      setAnnouncements(data.announcements);
    } catch (error) {
      setAnnouncements([]);
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await apiRequest(`/api/admin/announcements/${deleting.id}`, { method: "DELETE" });
      notify("Announcement deleted.");
      setDeleting(null);
      await load();
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div>
      <PageSectionHeader
        title="Announcements"
        description="Publish updates to the homepage and the public announcements page."
        action={
          isOwner ? (
            <button
              type="button"
              className="btn-primary !px-4 !py-2.5 text-xs"
              onClick={() => setEditor({ mode: "create" })}
            >
              <PlusIcon width={14} height={14} />
              New announcement
            </button>
          ) : undefined
        }
      />

      {loadError && <div className="mt-5"><ErrorNote>{loadError}</ErrorNote></div>}

      <div className="panel mt-5 overflow-hidden">
        {announcements === null ? (
          <div className="px-6 py-16">
            <Spinner label="Loading announcements" />
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<MegaphoneIcon width={19} height={19} />}
            title="No announcements yet"
            description="Publish your first update and it will show up on the homepage and announcements page."
            action={
              isOwner ? (
                <button
                  type="button"
                  className="btn-ghost !py-2.5 text-xs"
                  onClick={() => setEditor({ mode: "create" })}
                >
                  <PlusIcon width={14} height={14} />
                  Write an announcement
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      {formatDate(announcement.createdAt)}
                      {announcement.updatedAt !== announcement.createdAt && " · edited"}
                    </p>
                    <h3 className="mt-1.5 font-display text-sm font-semibold text-white">
                      {announcement.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-zinc-500">
                      {announcement.body}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${announcement.title}`}
                        className="icon-btn"
                        onClick={() => setEditor({ mode: "edit", announcement })}
                      >
                        <PencilIcon width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${announcement.title}`}
                        className="icon-btn hover:border-ember/30 hover:text-ember-bright"
                        onClick={() => setDeleting(announcement)}
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editor && (
        <AnnouncementEditor
          key={editor.mode === "edit" ? editor.announcement.id : "new"}
          announcement={editor.mode === "edit" ? editor.announcement : null}
          onClose={() => setEditor(null)}
          onSaved={(mode) => {
            setEditor(null);
            notify(mode === "create" ? "Announcement published." : "Announcement updated.");
            void load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete announcement"
          message={`Delete “${deleting.title}”? This removes it from the site immediately.`}
          pending={deletePending}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
