"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateSpace } from "@/app/spaces/actions";
import { InviteCollaboratorsModal } from "@/components/InviteCollaboratorsModal";
import type { SpacePageData } from "@/app/spaces/actions";

type SpaceWorkspaceProps = {
  spaceId: string;
  initialData: NonNullable<SpacePageData>;
};

export function SpaceWorkspace({ spaceId, initialData }: SpaceWorkspaceProps) {
  const router = useRouter();
  const initialTitle =
    !initialData.title?.trim() || initialData.title.trim().toLowerCase() === "untitled"
      ? ""
      : initialData.title;
  const [title, setTitle] = useState(initialTitle);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const pendingNavigateRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const memberCount = initialData.memberCount;
  const canPublish = memberCount >= 2;

  const save = useCallback(async () => {
    setSaving(true);
    setSaveStatus("idle");
    const result = await updateSpace(spaceId, { title: title.trim() || "Untitled" });
    setSaving(false);
    if (result.ok) {
      setDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  }, [spaceId, title]);

  // Debounced autosave when title changes
  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      save();
    }, 1500);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [dirty, title, save]);

  // Block browser refresh/close when dirty
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      if (!dirty) {
        router.push("/dashboard");
        return;
      }
      e.preventDefault();
      setLeaveDialogOpen(true);
    },
    [dirty, router]
  );

  const handleLeaveSave = useCallback(async () => {
    await save();
    setLeaveDialogOpen(false);
    router.push("/dashboard");
  }, [save, router]);

  const handleLeaveDiscard = useCallback(() => {
    setLeaveDialogOpen(false);
    setDirty(false);
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-black px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            onClick={handleBack}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            <span aria-hidden>←</span>
            back
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              onBlur={() => {}}
              className="w-full max-w-md bg-transparent text-center text-lg font-medium outline-none placeholder:text-zinc-400 md:mx-auto"
              placeholder="untitled space"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200"
          >
            invite collaborators
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-lg border border-black bg-[#00cefc] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#00b3dd] disabled:opacity-50"
          >
            {saving ? "Saving…" : saveStatus === "saved" ? "Saved" : "save"}
          </button>
          <button
            type="button"
            disabled={!canPublish}
            className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            title={!canPublish ? "Add at least 2 people to publish" : undefined}
          >
            publish
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto grid h-full min-h-[60vh] max-w-5xl grid-cols-1 grid-rows-4 gap-px overflow-hidden rounded-xl border-2 border-black bg-black md:grid-cols-2 md:grid-rows-2">
          <section className="flex flex-col bg-zinc-100 p-4 rounded-t-xl md:rounded-tl-xl">
            <h2 className="text-sm font-semibold tracking-tight">chat</h2>
            <div className="mt-2 flex flex-1 items-center justify-center text-xs text-zinc-500">
              Placeholder
            </div>
          </section>
          <section className="flex flex-col bg-zinc-100 p-4 md:rounded-tr-xl">
            <h2 className="text-sm font-semibold tracking-tight">view/upload media</h2>
            <p className="text-xs text-zinc-500">photo/video/audio</p>
            <div className="mt-2 flex flex-1 items-center justify-center text-xs text-zinc-500">
              Placeholder
            </div>
          </section>
          <section className="flex flex-col bg-zinc-100 p-4 md:rounded-bl-xl">
            <h2 className="text-sm font-semibold tracking-tight">bulletin board</h2>
            <div className="mt-2 flex flex-1 items-center justify-center text-xs text-zinc-500">
              Placeholder
            </div>
          </section>
          <section className="flex flex-col bg-zinc-100 p-4 rounded-b-xl md:rounded-br-xl">
            <h2 className="text-sm font-semibold tracking-tight">task board</h2>
            <div className="mt-2 flex flex-1 items-center justify-center text-xs text-zinc-500">
              Placeholder
            </div>
          </section>
        </div>
      </main>

      {inviteOpen && <InviteCollaboratorsModal onClose={() => setInviteOpen(false)} />}

      {leaveDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLeaveDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">Save before leaving?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLeaveSave}
                className="rounded-lg border border-black bg-[#00cefc] px-3 py-1.5 text-sm font-semibold text-black"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleLeaveDiscard}
                className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200"
              >
                Don&apos;t save
              </button>
              <button
                type="button"
                onClick={() => setLeaveDialogOpen(false)}
                className="rounded-lg border border-[color:var(--border-subtle)] px-3 py-1.5 text-sm font-medium hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
