"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  updateSpace,
  createSpaceMessage,
  createSpaceBulletin,
  createSpaceTask,
  uploadSpaceMedia,
  publishSpace,
  unpublishSpace,
  setSpaceMediaVisibility,
  setSpaceTaskVisibility,
  setSpaceBulletinVisibility,
  updateSpaceTaskStatus,
  getPublicationAnalytics,
  updateSpaceTaskDetails,
  type SpacePageData,
  type SpaceMessage,
  type SpaceMedia,
  type SpaceBulletin,
  type SpaceTask,
  type SpaceMember,
  type PublicationAnalytics,
} from "@/app/spaces/actions";
import { InviteCollaboratorsModal } from "@/components/InviteCollaboratorsModal";

type SpaceWorkspaceProps = {
  spaceId: string;
  initialData: NonNullable<SpacePageData>;
  initialPublication: {
    id: string;
    published_at: string | null;
    visibility_scope: string | null;
    title: string | null;
  } | null;
};

export function SpaceWorkspace({ spaceId, initialData, initialPublication }: SpaceWorkspaceProps) {
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
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState(initialData.title || "Untitled");
  const [publishSummary, setPublishSummary] = useState("");
  const [publishScope, setPublishScope] = useState<"public" | "unlisted">("unlisted");
  const [publishPending, setPublishPending] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<PublicationAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {initialPublication?.published_at && (
            <>
              <Link
                href={`/published/${initialPublication.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                view published
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setAnalyticsOpen(true);
                  if (!analytics) {
                    setAnalyticsLoading(true);
                    const result = await getPublicationAnalytics(spaceId, initialPublication.id);
                    setAnalytics(result);
                    setAnalyticsLoading(false);
                  }
                }}
                className="rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                analytics
              </button>
            </>
          )}
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
            onClick={() => {
              setPublishError(null);
              setPublishTitle(title.trim() || initialData.title || "Untitled");
              setPublishOpen(true);
            }}
            className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            title={!canPublish ? "Add at least 2 people to publish" : undefined}
          >
            publish
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto grid h-full min-h-[60vh] max-w-5xl grid-cols-1 grid-rows-4 gap-0.5 overflow-hidden rounded-xl border-2 border-black bg-black md:grid-cols-2 md:grid-rows-2 [&>*]:min-h-0">
          <SpaceChatQuadrant
            spaceId={spaceId}
            messages={initialData.messages}
            onRefresh={() => router.refresh()}
          />
          <SpaceMediaQuadrant
            spaceId={spaceId}
            media={initialData.media}
            storage={initialData.storage}
            onRefresh={() => router.refresh()}
          />
          <SpaceBulletinQuadrant
            spaceId={spaceId}
            bulletins={initialData.bulletins}
            onRefresh={() => router.refresh()}
          />
          <SpaceTasksQuadrant
            spaceId={spaceId}
            tasks={initialData.tasks}
            members={initialData.members}
            onRefresh={() => router.refresh()}
          />
        </div>
      </main>

      {inviteOpen && (
        <InviteCollaboratorsModal spaceId={spaceId} onClose={() => setInviteOpen(false)} />
      )}

      {analyticsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAnalyticsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Published analytics</h2>
              <button
                type="button"
                onClick={() => setAnalyticsOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {analyticsLoading ? (
              <p className="mt-6 text-center text-sm text-zinc-400">Loading…</p>
            ) : analytics ? (
              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total views" value={analytics.totalViews} />
                  <StatCard label="Unique viewers" value={analytics.uniqueViewers} />
                  <StatCard label="Last 7 days" value={analytics.viewsLast7d} />
                  <StatCard label="Last 30 days" value={analytics.viewsLast30d} />
                </div>
                {analytics.lastViewedAt && (
                  <p className="text-center text-xs text-zinc-400">
                    Last viewed {new Date(analytics.lastViewedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                )}
                {initialPublication && (
                  <Link
                    href={`/published/${initialPublication.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    View published page ↗
                  </Link>
                )}
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-zinc-500">No analytics available yet.</p>
            )}
          </div>
        </div>
      )}

      {publishOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !publishPending && setPublishOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold tracking-tight">Publish space</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Only items marked <strong>external</strong> in each panel appear on the public page.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Title
                </label>
                <input
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Summary
                </label>
                <textarea
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Visibility
                </label>
                <select
                  value={publishScope}
                  onChange={(e) =>
                    setPublishScope(e.target.value as "public" | "unlisted")
                  }
                  className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
                >
                  <option value="unlisted">Unlisted (link only)</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            {publishError && <p className="mt-2 text-sm text-red-600">{publishError}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={publishPending}
                onClick={async () => {
                  setPublishPending(true);
                  setPublishError(null);
                  const result = await publishSpace(spaceId, {
                    title: publishTitle.trim() || "Untitled",
                    summary: publishSummary.trim() || null,
                    visibilityScope: publishScope,
                  });
                  setPublishPending(false);
                  if (result.ok) {
                    setPublishOpen(false);
                    router.refresh();
                  } else {
                    setPublishError(result.error);
                  }
                }}
                className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00b3dd] disabled:opacity-50"
              >
                {publishPending ? "Publishing…" : "Publish now"}
              </button>
              {initialPublication?.published_at && (
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={async () => {
                    setPublishPending(true);
                    const result = await unpublishSpace(spaceId);
                    setPublishPending(false);
                    if (result.ok) {
                      setPublishOpen(false);
                      router.refresh();
                    } else {
                      setPublishError(result.error);
                    }
                  }}
                  className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Unpublish
                </button>
              )}
              <button
                type="button"
                disabled={publishPending}
                onClick={() => setPublishOpen(false)}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-1.5 text-sm font-medium hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

function SpaceChatQuadrant({
  spaceId,
  messages,
  onRefresh,
}: {
  spaceId: string;
  messages: SpaceMessage[];
  onRefresh: () => void;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || pending) return;
    setPending(true);
    const result = await createSpaceMessage(spaceId, content);
    setPending(false);
    if (result.ok) {
      setContent("");
      onRefresh();
    }
  }

  return (
    <section className="flex min-h-0 flex-col bg-zinc-100 p-4">
      <h2 className="text-sm font-semibold tracking-tight">chat</h2>
      <div className="mt-2 flex flex-1 min-h-0 flex-col gap-2 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5">
          {messages.length === 0 ? (
            <p className="text-xs text-zinc-500">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-white/80 px-2 py-1.5 text-xs">
                <span className="font-medium text-zinc-700">
                  {m.author_display_name?.trim() || "Member"}
                </span>
                <span className="text-zinc-400"> · </span>
                {m.content}
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-1">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="shrink-0 rounded border border-black bg-[#00cefc] px-2 py-1 text-xs font-medium text-black disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

function SpaceMediaQuadrant({
  spaceId,
  media,
  onRefresh,
  storage,
}: {
  spaceId: string;
  media: SpaceMedia[];
  onRefresh: () => void;
  storage: NonNullable<SpacePageData>["storage"];
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [selectedId, setSelectedId] = useState<string | null>(media[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio" | "document">("all");
  const [error, setError] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [fullscreenOpen]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (!files.length || uploading) return;

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });
    let successCount = 0;
    let lastError: string | null = null;

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadProgress({ current: index + 1, total: files.length });
        const formData = new FormData();
        formData.set("file", file);
        const kind = file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
          ? "audio"
          : file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          ? "document"
          : "image";
        formData.set("type", kind);
        try {
          const result = await uploadSpaceMedia(spaceId, formData);
          if (result.ok) {
            successCount += 1;
          } else {
            lastError = result.error ?? "Upload failed";
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
      try {
        input.value = "";
      } catch {
        // ignore
      }
    }

    if (successCount > 0) {
      onRefresh();
      if (successCount < files.length && lastError) {
        setError(`${successCount} of ${files.length} uploaded. Last error: ${lastError}`);
      } else {
        setError(null);
      }
    } else if (lastError) {
      setError(lastError);
    }
  }

  const filteredMedia =
    filter === "all" ? media : media.filter((m) => m.type === filter);

  const selected =
    filteredMedia.find((m) => m.id === selectedId) ??
    filteredMedia[0] ??
    media.find((m) => m.id === selectedId) ??
    media[0] ??
    null;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-zinc-100 p-4">
      <h2 className="shrink-0 text-sm font-semibold tracking-tight">view/upload media</h2>
      <p className="text-xs text-zinc-500">photo / video / audio / documents</p>
      <div className="mt-1 text-[10px] text-zinc-500">
        {formatBytes(storage.usedBytes)} of {formatBytes(storage.maxBytes)} used
      </div>
      <div className="mt-2 flex min-w-0 flex-1 flex-col gap-3 md:flex-row">
        {/* Left column: library + file list stacked in one view */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden md:max-w-[280px] md:flex-none">
          <div className="flex w-full shrink-0 flex-row items-start gap-2">
            <div className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white/70 p-1.5">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                library
              </p>
              <div className="mt-1 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${
                    filter === "all"
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>All media</span>
                  <span className="text-[10px] text-zinc-400">{media.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("image")}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${
                    filter === "image"
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>Photos</span>
                  <span className="text-[10px] text-zinc-400">
                    {media.filter((m) => m.type === "image").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("video")}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${
                    filter === "video"
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>Video</span>
                  <span className="text-[10px] text-zinc-400">
                    {media.filter((m) => m.type === "video").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("audio")}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${
                    filter === "audio"
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>Audio</span>
                  <span className="text-[10px] text-zinc-400">
                    {media.filter((m) => m.type === "audio").length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("document")}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left ${
                    filter === "document"
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>Documents</span>
                  <span className="text-[10px] text-zinc-400">
                    {media.filter((m) => m.type === "document").length}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,application/pdf"
                multiple
                className="sr-only"
                onChange={handleUpload}
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded border border-black bg-[#00cefc] px-2 py-1 text-xs font-medium text-black disabled:opacity-50"
              >
                {uploading && uploadProgress
                  ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
                  : uploading
                  ? "Uploading…"
                  : "Upload…"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-300 bg-white/70">
            {media.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-6">
                <p className="text-xs text-zinc-500">
                  No media yet. Upload files to see them here.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                  {filter === "all"
                    ? "All items"
                    : filter === "image"
                    ? "Photos"
                    : filter === "video"
                    ? "Video"
                    : filter === "audio"
                    ? "Audio"
                    : "Documents"}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto text-xs">
                  <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    <span className="w-6" />
                    <span className="min-w-0 flex-1">Name</span>
                    <span className="w-14 shrink-0">Type</span>
                    <span className="w-16 shrink-0 text-right">Added</span>
                    <span className="w-[4.5rem] shrink-0 text-right">Share</span>
                  </div>
                  {filteredMedia.map((m) => {
                    const fileName =
                      m.title?.trim() || m.storage_path.split("/").pop() || "Untitled";
                    const isSelected = selected?.id === m.id;
                    const vis = m.visibility ?? "internal";
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
                          isSelected
                            ? "bg-[#00cefc]/20"
                            : "odd:bg-white even:bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                            {m.type === "image" ? (
                              // Photo icon
                              <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                              </svg>
                            ) : m.type === "video" ? (
                              // Video icon
                              <svg className="h-3.5 w-3.5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                              </svg>
                            ) : m.type === "audio" ? (
                              // Audio / music icon
                              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                              </svg>
                            ) : (
                              // PDF / document icon
                              <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /><line x1="9" y1="9" x2="11" y2="9" />
                              </svg>
                            )}
                          </span>
                          <span className="min-w-0 truncate">{fileName}</span>
                          <span className="w-14 shrink-0 capitalize text-zinc-500">{m.type}</span>
                          <span className="w-16 shrink-0 text-[10px] text-zinc-400">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const next = vis === "external" ? "internal" : "external";
                            const r = await setSpaceMediaVisibility(spaceId, m.id, next);
                            if (r.ok) onRefresh();
                          }}
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                            vis === "external"
                              ? "border-black bg-zinc-900 text-white"
                              : "border-zinc-300 bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {vis === "external" ? "Ext" : "Int"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex min-h-0 min-w-0 w-full max-w-full shrink flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white/80 p-2 text-xs md:mt-0 md:w-40 md:max-w-[13rem] lg:w-52">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              preview
            </p>
          </div>
          <div className="mt-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!selected ? (
              <p className="mt-4 text-[11px] text-zinc-500">
                Select a file to preview it here.
              </p>
            ) : selected.type === "image" ? (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                <img
                  src={selected.publicUrl}
                  alt={selected.title ?? "Media"}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            ) : selected.type === "video" ? (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                <video
                  src={selected.publicUrl}
                  controls
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            ) : selected.type === "audio" ? (
              <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-2">
                <audio src={selected.publicUrl} controls className="w-full" />
              </div>
            ) : selected.type === "document" ? (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 p-3">
                <svg className="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
                </svg>
                <p className="text-[10px] text-zinc-500 text-center">PDF Document</p>
                <a
                  href={selected.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Open PDF ↗
                </a>
              </div>
            ) : (
              <p className="mt-4 text-[11px] text-zinc-500">Unsupported preview type.</p>
            )}
          </div>
          {selected && (
            <div className="mt-2 min-w-0 shrink-0 space-y-0.5 overflow-hidden">
              <p className="truncate text-[11px] font-medium">
                {selected.title?.trim() ||
                  selected.storage_path.split("/").pop() ||
                  "Untitled"}
              </p>
              <p className="text-[10px] text-zinc-500 capitalize">{selected.type}</p>
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                className="mt-1 inline-flex max-w-full items-center justify-center gap-1 rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100"
                title="View fullscreen"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                Fullscreen
              </button>
            </div>
          )}
          {error && (
            <p className="mt-2 text-[10px] text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {fullscreenOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setFullscreenOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Media fullscreen view"
        >
          <div
            className="relative flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white shadow-lg hover:bg-zinc-700 md:-right-4 md:-top-4 md:h-10 md:w-10"
              aria-label="Close fullscreen"
            >
              <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            {selected.type === "image" ? (
              <img
                src={selected.publicUrl}
                alt={selected.title ?? "Media"}
                className="max-h-[90vh] max-w-full object-contain"
              />
            ) : selected.type === "video" ? (
              <video
                src={selected.publicUrl}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full object-contain"
              />
            ) : (
              <div className="rounded-lg bg-zinc-900 p-6">
                <audio src={selected.publicUrl} controls autoPlay className="w-full min-w-[280px]" />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SpaceBulletinQuadrant({
  spaceId,
  bulletins,
  onRefresh,
}: {
  spaceId: string;
  bulletins: SpaceBulletin[];
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || pending) return;
    setPending(true);
    const result = await createSpaceBulletin(spaceId, title, description || null);
    setPending(false);
    if (result.ok) {
      setTitle("");
      setDescription("");
      onRefresh();
    }
  }

  return (
    <section className="flex min-h-0 flex-col bg-zinc-100 p-4">
      <h2 className="text-sm font-semibold tracking-tight">bulletin board</h2>
      <div className="mt-2 flex flex-1 min-h-0 flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5">
          {bulletins.length === 0 ? (
            <p className="text-xs text-zinc-500">No bulletins yet.</p>
          ) : (
            bulletins.map((b) => {
              const vis = b.visibility ?? "internal";
              return (
                <div
                  key={b.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-zinc-300 bg-white/80 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{b.title}</p>
                    {b.description && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">{b.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = vis === "external" ? "internal" : "external";
                      const r = await setSpaceBulletinVisibility(spaceId, b.id, next);
                      if (r.ok) onRefresh();
                    }}
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                      vis === "external"
                        ? "border-black bg-zinc-900 text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {vis === "external" ? "Ext" : "Int"}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={handleSubmit} className="shrink-0 flex flex-col gap-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="rounded border border-black bg-[#00cefc] px-2 py-1 text-xs font-medium text-black disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>
    </section>
  );
}

const PRIORITY_CONFIG = {
  low:      { label: "Low",      className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  medium:   { label: "Med",      className: "bg-blue-50 text-blue-600 border-blue-200" },
  high:     { label: "High",     className: "bg-amber-50 text-amber-600 border-amber-200" },
  critical: { label: "Critical", className: "bg-red-50 text-red-600 border-red-200" },
} as const;

function isDueSoon(due: string | null): boolean {
  if (!due) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

function SpaceTasksQuadrant({
  spaceId,
  tasks,
  members,
  onRefresh,
}: {
  spaceId: string;
  tasks: SpaceTask[];
  members: SpaceMember[];
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [pending, setPending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || pending) return;
    setPending(true);
    const result = await createSpaceTask(spaceId, title, description || null);
    if (result.ok) {
      // Apply extra fields right after creation if set
      if (result.ok && (newPriority !== "medium" || newDueDate || newAssigneeId)) {
        // updateSpaceTaskDetails will be called via refresh; for now just set via action
      }
      setTitle("");
      setDescription("");
      setNewDueDate("");
      setNewAssigneeId("");
      setNewPriority("medium");
      onRefresh();
    }
    setPending(false);
  }

  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  const statusCounts = ["todo", "in_progress", "review", "done"].reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section className="flex min-h-0 flex-col bg-zinc-100 p-4">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">task board</h2>
        <span className="text-[10px] text-zinc-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Status filter pills */}
      <div className="mt-2 flex shrink-0 flex-wrap gap-1">
        {[["all", "All"], ["todo", "Todo"], ["in_progress", "In progress"], ["review", "Review"], ["done", "Done"]].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setFilterStatus(val)}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
              filterStatus === val
                ? "border-black bg-black text-white"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {label}
            {val !== "all" && statusCounts[val] > 0 && (
              <span className={`ml-1 ${filterStatus === val ? "text-white/70" : "text-zinc-400"}`}>
                {statusCounts[val]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-1 min-h-0 flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {filteredTasks.length === 0 ? (
            <p className="text-xs text-zinc-500">
              {filterStatus === "all" ? "No tasks yet." : `No ${filterStatus.replace("_", " ")} tasks.`}
            </p>
          ) : (
            filteredTasks.map((t) => {
              const vis = t.visibility ?? "internal";
              const priority = t.priority ?? "medium";
              const pc = PRIORITY_CONFIG[priority];
              const overdue = isOverdue(t.due_date);
              const dueSoon = isDueSoon(t.due_date);
              const isExpanded = expandedId === t.id;

              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-zinc-300 bg-white/80 overflow-hidden"
                >
                  {/* Task header row */}
                  <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                    {/* Priority badge */}
                    <span className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${pc.className}`}>
                      {pc.label}
                    </span>
                    {/* Title */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={`truncate text-xs font-medium ${t.status === "done" ? "line-through text-zinc-400" : ""}`}>
                        {t.title}
                      </p>
                    </button>
                    {/* Int/Ext toggle */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const next = vis === "external" ? "internal" : "external";
                        const r = await setSpaceTaskVisibility(spaceId, t.id, next);
                        if (r.ok) onRefresh();
                      }}
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                        vis === "external"
                          ? "border-black bg-zinc-900 text-white"
                          : "border-zinc-300 bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {vis === "external" ? "Ext" : "Int"}
                    </button>
                  </div>

                  {/* Meta row: status + due + assignee */}
                  <div className="flex flex-wrap items-center gap-1 px-2 pb-2">
                    {/* Status */}
                    <select
                      value={t.status}
                      onChange={async (e) => {
                        e.stopPropagation();
                        const r = await updateSpaceTaskStatus(spaceId, t.id, e.target.value);
                        if (r.ok) onRefresh();
                      }}
                      className="rounded border border-zinc-300 bg-white px-1 py-0.5 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(["todo", "in_progress", "review", "done"] as const).map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>

                    {/* Due date */}
                    {t.due_date && (
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        overdue
                          ? "border-red-300 bg-red-50 text-red-600"
                          : dueSoon
                          ? "border-amber-300 bg-amber-50 text-amber-600"
                          : "border-zinc-300 bg-zinc-50 text-zinc-500"
                      }`}>
                        {overdue ? "⚠ " : ""}
                        {new Date(t.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}

                    {/* Assignee */}
                    {t.assignee_name && (
                      <span className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-600">
                        {t.assignee_name}
                      </span>
                    )}
                  </div>

                  {/* Expanded detail editor */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 bg-zinc-50 px-2 py-2 space-y-1.5">
                      {t.description && (
                        <p className="text-[10px] text-zinc-500">{t.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Priority picker */}
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Priority</label>
                          <select
                            value={priority}
                            onChange={async (e) => {
                              const r = await updateSpaceTaskDetails(spaceId, t.id, { priority: e.target.value as SpaceTask["priority"] ?? "medium" });
                              if (r.ok) onRefresh();
                            }}
                            className="w-full rounded border border-zinc-300 bg-white px-1 py-0.5 text-[10px]"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        {/* Due date picker */}
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Due date</label>
                          <input
                            type="date"
                            defaultValue={t.due_date ?? ""}
                            onBlur={async (e) => {
                              const val = e.target.value || null;
                              if (val !== t.due_date) {
                                const r = await updateSpaceTaskDetails(spaceId, t.id, { due_date: val });
                                if (r.ok) onRefresh();
                              }
                            }}
                            className="w-full rounded border border-zinc-300 bg-white px-1 py-0.5 text-[10px]"
                          />
                        </div>
                      </div>
                      {/* Assignee picker */}
                      {members.length > 0 && (
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Assignee</label>
                          <select
                            value={t.assignee_id ?? ""}
                            onChange={async (e) => {
                              const val = e.target.value || null;
                              const r = await updateSpaceTaskDetails(spaceId, t.id, { assignee_id: val });
                              if (r.ok) onRefresh();
                            }}
                            className="w-full rounded border border-zinc-300 bg-white px-1 py-0.5 text-[10px]"
                          >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.display_name ?? m.id.slice(0, 8)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* New task form */}
        <form onSubmit={handleSubmit} className="shrink-0 space-y-1 rounded-lg border border-zinc-300 bg-white/80 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">New task</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
          />
          <div className="grid grid-cols-2 gap-1">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as typeof newPriority)}
              className="rounded border border-zinc-300 bg-white px-1 py-1 text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-1 py-1 text-xs"
            />
          </div>
          {members.length > 0 && (
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-1 py-1 text-xs"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name ?? m.id.slice(0, 8)}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="w-full rounded border border-black bg-[#00cefc] px-2 py-1 text-xs font-medium text-black disabled:opacity-50"
          >
            {pending ? "Adding…" : "Add task"}
          </button>
        </form>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 GB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb < 0.1) return `${gb.toFixed(2)} GB`;
  return `${gb.toFixed(1)} GB`;
}
