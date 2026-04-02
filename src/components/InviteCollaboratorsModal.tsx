"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createSpaceInvite, searchProfiles, ProfileSearchResult } from "@/app/spaces/actions";

type Tab = "add" | "email";

type SelectedUser = ProfileSearchResult;

type InviteCollaboratorsModalProps = {
  spaceId: string;
  onClose: () => void;
};

export function InviteCollaboratorsModal({ spaceId, onClose }: InviteCollaboratorsModalProps) {
  const [tab, setTab] = useState<Tab>("add");

  // --- Add Colabs users ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [selected, setSelected] = useState<SelectedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addPending, startAddTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Email invite ---
  const [email, setEmail] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSaved, setEmailSaved] = useState(false);

  const runSearch = useCallback(
    (q: string) => {
      if (q.trim().length === 0) {
        setResults([]);
        return;
      }
      setSearching(true);
      searchProfiles(q, spaceId).then((res) => {
        setResults(res);
        setSearching(false);
      });
    },
    [spaceId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectUser(user: ProfileSearchResult) {
    if (!selected.find((u) => u.id === user.id)) {
      setSelected((prev) => [...prev, user]);
    }
    setQuery("");
    setResults([]);
  }

  function removeUser(id: string) {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }

  function handleAdd() {
    if (selected.length === 0) return;
    setAddError(null);
    startAddTransition(async () => {
      const errors: string[] = [];
      let successCount = 0;
      for (const user of selected) {
        const result = await createSpaceInvite({ spaceId, inviteeProfileId: user.id });
        if (!result.ok) {
          errors.push(`${user.display_name ?? "User"}: ${result.error}`);
        } else {
          successCount++;
        }
      }
      if (errors.length > 0) {
        setAddError(errors.join(" · "));
      }
      if (successCount > 0) {
        setAddedCount((c) => c + successCount);
        setSelected([]);
      }
    });
  }

  function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter an email address.");
      return;
    }
    setEmailError(null);
    startEmailTransition(async () => {
      const result = await createSpaceInvite({ spaceId, inviteeEmail: trimmed });
      if (!result.ok) {
        setEmailError(result.error);
        return;
      }
      setEmailSaved(true);
      setEmail("");
    });
  }

  const selectedIds = new Set(selected.map((u) => u.id));
  const filteredResults = results.filter((r) => !selectedIds.has(r.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Invite collaborators</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[color:var(--border-subtle)] px-5 pt-3">
          <button
            onClick={() => setTab("add")}
            className={`pb-2.5 text-sm font-medium transition-colors ${
              tab === "add"
                ? "border-b-2 border-black text-black"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Add people
          </button>
          <button
            onClick={() => setTab("email")}
            className={`ml-4 pb-2.5 text-sm font-medium transition-colors ${
              tab === "email"
                ? "border-b-2 border-black text-black"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Invite by email
          </button>
        </div>

        <div className="px-5 py-4">
          {/* ── ADD COLABS USERS ── */}
          {tab === "add" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Search for people already on Colabs to add them to this space.
              </p>

              {/* Search input + dropdown */}
              <div className="relative" ref={searchRef}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-black focus:ring-0"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                  </div>
                )}
                {filteredResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-[color:var(--border-subtle)] bg-white py-1 shadow-lg">
                    {filteredResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectUser(user)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-50"
                      >
                        <Avatar name={user.display_name} avatarUrl={user.avatar_url} size={28} />
                        <span className="text-sm font-medium">{user.display_name ?? "Unnamed"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map((user) => (
                    <span
                      key={user.id}
                      className="flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-zinc-100 py-1 pl-2.5 pr-2 text-xs font-medium"
                    >
                      <Avatar name={user.display_name} avatarUrl={user.avatar_url} size={18} />
                      {user.display_name ?? "Unnamed"}
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="ml-0.5 rounded-full text-zinc-400 hover:text-zinc-700"
                        aria-label={`Remove ${user.display_name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {addError && <p className="text-xs text-red-600">{addError}</p>}

              {addedCount > 0 && (
                <p className="text-xs font-medium text-emerald-600">
                  {addedCount} invite{addedCount !== 1 ? "s" : ""} sent successfully.
                </p>
              )}

              <button
                type="button"
                onClick={handleAdd}
                disabled={addPending || selected.length === 0}
                className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-40"
              >
                {addPending
                  ? "Adding…"
                  : selected.length > 0
                  ? `Add ${selected.length} ${selected.length === 1 ? "person" : "people"}`
                  : "Add"}
              </button>
            </div>
          )}

          {/* ── INVITE BY EMAIL ── */}
          {tab === "email" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Not on Colabs yet? Enter their email and we&apos;ll save the invite. When they
                create an account it will appear in their dashboard automatically.
              </p>

              <form onSubmit={handleEmailSave} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailSaved(false); }}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-black"
                />
                {emailError && <p className="text-xs text-red-600">{emailError}</p>}
                {emailSaved && (
                  <p className="text-xs font-medium text-emerald-600">
                    Saved — send them an invite manually and they&apos;ll see it once they join Colabs.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={emailPending}
                  className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-40"
                >
                  {emailPending ? "Saving…" : "Save invite"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
  size,
}: {
  name: string | null;
  avatarUrl: string | null;
  size: number;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? "User"}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-300 text-[10px] font-bold text-zinc-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
