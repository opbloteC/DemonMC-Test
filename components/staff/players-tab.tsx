"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/icons";
import { ROLE_BADGE, formatDate } from "@/lib/format";
import {
  PLAYER_CATEGORIES,
  PLAYER_CATEGORY_LABELS,
  type PlayerCategory,
  type PlayerProfile,
} from "@/lib/types";
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

interface PlayerFormState {
  username: string;
  category: PlayerCategory;
  rankLabel: string;
  description: string;
  joinedAt: string;
  avatarUrl: string;
}

function PlayerEditor({
  player,
  onClose,
  onSaved,
}: {
  player: PlayerProfile | null;
  onClose: () => void;
  onSaved: (username: string, mode: "create" | "edit") => void;
}) {
  const [form, setForm] = useState<PlayerFormState>({
    username: player?.username ?? "",
    category: player?.category ?? "player",
    rankLabel: player?.rankLabel ?? "",
    description: player?.description ?? "",
    joinedAt: player?.joinedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    avatarUrl: player?.avatarUrl ?? "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function set<K extends keyof PlayerFormState>(key: K, value: PlayerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await apiRequest(player ? `/api/admin/players/${player.id}` : "/api/admin/players", {
        method: player ? "PATCH" : "POST",
        body: {
          username: form.username,
          category: form.category,
          rankLabel: form.rankLabel,
          description: form.description,
          joinedAt: form.joinedAt,
          avatarUrl: form.avatarUrl,
        },
      });
      onSaved(form.username.trim(), player ? "edit" : "create");
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <Modal
      title={player ? "Edit player" : "Add player"}
      description={
        player
          ? "Update this profile on the public roster."
          : "Add a player profile to the public roster."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Minecraft username"
            htmlFor="player-username"
            hint="3–16 characters. The head avatar is pulled from this name."
          >
            <input
              id="player-username"
              className="input"
              required
              minLength={3}
              maxLength={16}
              pattern="[A-Za-z0-9_ ]{3,16}"
              autoComplete="off"
              spellCheck={false}
              value={form.username}
              onChange={(event) => set("username", event.target.value)}
              placeholder="Notch"
            />
          </Field>

          <Field label="Category" htmlFor="player-category">
            <select
              id="player-category"
              className="input"
              value={form.category}
              onChange={(event) => set("category", event.target.value as PlayerCategory)}
            >
              {PLAYER_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {PLAYER_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Rank label" htmlFor="player-rank" hint="Optional, shown beside the category.">
            <input
              id="player-rank"
              className="input"
              maxLength={40}
              value={form.rankLabel}
              onChange={(event) => set("rankLabel", event.target.value)}
              placeholder="e.g. Season 1 Champion"
            />
          </Field>

          <Field label="Date joined" htmlFor="player-joined">
            <input
              id="player-joined"
              type="date"
              className="input"
              required
              value={form.joinedAt}
              onChange={(event) => set("joinedAt", event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="player-description"
          hint="Optional, up to 300 characters."
        >
          <textarea
            id="player-description"
            rows={3}
            maxLength={300}
            className="input resize-none"
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="A short line about this player."
          />
        </Field>

        <Field
          label="Avatar URL"
          htmlFor="player-avatar"
          hint="Optional. Leave blank to use the Minecraft head for the username."
        >
          <input
            id="player-avatar"
            type="url"
            className="input"
            maxLength={500}
            value={form.avatarUrl}
            onChange={(event) => set("avatarUrl", event.target.value)}
            placeholder="https://…"
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost !py-2.5 text-xs" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-xs">
            {pending ? "Saving…" : player ? "Save changes" : "Add player"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PlayersTab({ isOwner, notify }: { isOwner: boolean; notify: Notify }) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState<
    { mode: "create" } | { mode: "edit"; player: PlayerProfile } | null
  >(null);
  const [deleting, setDeleting] = useState<PlayerProfile | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const data = await apiRequest<{ players: PlayerProfile[] }>("/api/admin/players");
      setPlayers(data.players);
    } catch (error) {
      setPlayers([]);
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
      await apiRequest(`/api/admin/players/${deleting.id}`, { method: "DELETE" });
      notify(`Removed ${deleting.username} from the roster.`);
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
        title="Player profiles"
        description="Everyone listed here appears on the public Players page."
        action={
          isOwner ? (
            <button
              type="button"
              className="btn-primary !px-4 !py-2.5 text-xs"
              onClick={() => setEditor({ mode: "create" })}
            >
              <PlusIcon width={14} height={14} />
              Add player
            </button>
          ) : undefined
        }
      />

      {loadError && <div className="mt-5"><ErrorNote>{loadError}</ErrorNote></div>}

      <div className="panel mt-5 overflow-hidden">
        {players === null ? (
          <div className="px-6 py-16">
            <Spinner label="Loading players" />
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            icon={<UsersIcon width={19} height={19} />}
            title="No player profiles yet"
            description="Add the first player to start building the public roster."
            action={
              isOwner ? (
                <button
                  type="button"
                  className="btn-ghost !py-2.5 text-xs"
                  onClick={() => setEditor({ mode: "create" })}
                >
                  <PlusIcon width={14} height={14} />
                  Add your first player
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
                  <Avatar name={player.username} src={player.avatarUrl} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{player.username}</p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {player.description || player.rankLabel || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <span className={`badge ${ROLE_BADGE[player.category]}`}>
                    {PLAYER_CATEGORY_LABELS[player.category]}
                  </span>
                  {player.rankLabel && (
                    <span className="badge border-white/10 bg-white/[0.03] text-zinc-400">
                      {player.rankLabel}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 sm:w-32 sm:shrink-0">
                  Joined {formatDate(player.joinedAt)}
                </div>

                {isOwner && (
                  <div className="flex gap-1.5 sm:shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit ${player.username}`}
                      className="icon-btn"
                      onClick={() => setEditor({ mode: "edit", player })}
                    >
                      <PencilIcon width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${player.username}`}
                      className="icon-btn hover:border-ember/30 hover:text-ember-bright"
                      onClick={() => setDeleting(player)}
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editor && (
        <PlayerEditor
          key={editor.mode === "edit" ? editor.player.id : "new"}
          player={editor.mode === "edit" ? editor.player : null}
          onClose={() => setEditor(null)}
          onSaved={(username, mode) => {
            setEditor(null);
            notify(
              mode === "create" ? `${username} was added to the roster.` : `${username} was updated.`,
            );
            void load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete player profile"
          message={`Remove “${deleting.username}” from the public roster? This cannot be undone.`}
          pending={deletePending}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
