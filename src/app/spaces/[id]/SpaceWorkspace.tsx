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
  deleteSpaceTask,
  deleteSpaceBulletin,
  type SpacePageData,
  type SpaceMessage,
  type SpaceMedia,
  type SpaceBulletin,
  type SpaceTask,
  type SpaceMember,
  type PublicationAnalytics,
} from "@/app/spaces/actions";
import { publishToCommunity } from "@/app/community/actions";
import { InviteCollaboratorsModal } from "@/components/InviteCollaboratorsModal";
import { useSidebar } from "@/contexts/SidebarContext";

const CONTENT_STYLES = [
  {
    category: "Music",
    variants: [
      { id: "music-single-v1", name: "Single — V1", desc: "Audio file + title" },
      { id: "music-single-v2", name: "Single — V2", desc: "Audio + title + cover art + photography" },
      { id: "music-single-v3", name: "Single — V3", desc: "Audio + title + cover art + photography + music video" },
      { id: "music-ep", name: "EP", desc: "Extended play release" },
      { id: "music-album", name: "Album", desc: "Full album release" },
    ],
  },
  {
    category: "Zine",
    variants: [
      { id: "zine-v1", name: "Mini Zine Draft", desc: "Early-stage mini zine format" },
      { id: "zine-v2", name: "Mini Zine", desc: "Finished mini zine" },
      { id: "zine-v3", name: "Half Letter Zine", desc: "Half-letter format zine" },
      { id: "zine-v4", name: "Full Zine", desc: "Full letter format publication" },
    ],
  },
  {
    category: "Photography & Film",
    variants: [
      { id: "photo-series-v1", name: "Photo Series — V1", desc: "Photos + title" },
      { id: "photo-series-v2", name: "Photo Series — V2", desc: "Photos + title + description + location" },
      { id: "photo-editorial", name: "Editorial", desc: "Curated editorial spread" },
      { id: "short-film", name: "Short Film", desc: "Short film or video project" },
      { id: "music-video", name: "Music Video", desc: "Music video production" },
      { id: "documentary", name: "Documentary", desc: "Documentary or docu-short" },
    ],
  },
  {
    category: "Design & Art",
    variants: [
      { id: "art-series", name: "Art Series", desc: "Collection of artwork" },
      { id: "lookbook-v1", name: "Lookbook — V1", desc: "Fashion lookbook" },
      { id: "lookbook-v2", name: "Lookbook — V2", desc: "Lookbook with photography and styling notes" },
      { id: "brand-identity", name: "Brand Identity", desc: "Logo, type, and color system" },
      { id: "print-design", name: "Print Design", desc: "Poster, flyer, or print work" },
    ],
  },
  {
    category: "Social / Platform",
    variants: [
      { id: "youtube-video", name: "YouTube Video", desc: "Long-form video content" },
      { id: "instagram-reel", name: "Instagram Reel", desc: "Short-form vertical video" },
      { id: "tiktok", name: "TikTok", desc: "Short-form creative video" },
      { id: "podcast", name: "Podcast Episode", desc: "Audio podcast or episode" },
    ],
  },
  {
    category: "Performance & Events",
    variants: [
      { id: "live-performance", name: "Live Performance", desc: "Concert, show, or live event" },
      { id: "collab-set", name: "Collaborative Set", desc: "Joint DJ or live set" },
      { id: "theater", name: "Theater / Play", desc: "Stage performance or theatrical production" },
    ],
  },
];

type SpaceWorkspaceProps = {
  spaceId: string;
  initialData: NonNullable<SpacePageData>;
  initialPublication: {
    id: string;
    published_at: string | null;
    visibility_scope: string | null;
    title: string | null;
  } | null;
  initialCommunityPublish: { id: string; title: string } | null;
};

export function SpaceWorkspace({ spaceId, initialData, initialPublication, initialCommunityPublish }: SpaceWorkspaceProps) {
  const router = useRouter();
  const { collapse, expand } = useSidebar();
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
  const [publishContentStyle, setPublishContentStyle] = useState<string | null>(null);
  const [publishPostToCommunity, setPublishPostToCommunity] = useState(true);
  const [publishPending, setPublishPending] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<PublicationAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [communityPublishId, setCommunityPublishId] = useState<string | null>(
    initialCommunityPublish?.id ?? null
  );
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

  // Collapse the sidebar while inside a space; restore on leave
  useEffect(() => {
    collapse();
    return () => expand();
  }, [collapse, expand]);

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
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black px-4 py-3 md:px-6">
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
          {communityPublishId && (
            <Link
              href={`/community/collabs/${communityPublishId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              view on community
            </Link>
          )}
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => {
              setPublishError(null);
              setPublishContentStyle(null);
              setPublishPostToCommunity(true);
              setPublishOpen(true);
            }}
            className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            title={!canPublish ? "Add at least 2 people to publish" : undefined}
          >
            publish
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="grid flex-1 min-h-0 grid-cols-1 grid-rows-4 gap-0 md:grid-cols-2 md:grid-rows-2 [&>*]:min-h-0">
          <SpaceChatQuadrant
            spaceId={spaceId}
            messages={initialData.messages}
            onRefresh={() => router.refresh()}
            className="border-b border-dashed border-black md:border-r"
          />
          <SpaceMediaQuadrant
            spaceId={spaceId}
            media={initialData.media}
            storage={initialData.storage}
            onRefresh={() => router.refresh()}
            className="border-b border-dashed border-black"
          />
          <SpaceBulletinQuadrant
            spaceId={spaceId}
            bulletins={initialData.bulletins}
            onRefresh={() => router.refresh()}
            className="border-b border-dashed border-black md:border-r md:border-b-0"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !publishPending && setPublishOpen(false)}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-background shadow-xl"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Publish</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Choose a content style — or skip to publish as-is.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !publishPending && setPublishOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable style picker */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {CONTENT_STYLES.map((group) => (
                  <div key={group.category}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      {group.category}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.variants.map((v) => {
                        const isSelected = publishContentStyle === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() =>
                              setPublishContentStyle(isSelected ? null : v.id)
                            }
                            className={`group flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                isSelected
                                  ? "border-[#00cefc] bg-[#00cefc]"
                                  : "border-zinc-300 bg-white group-hover:border-zinc-400"
                              }`}
                            >
                              {isSelected && (
                                <svg className="h-2 w-2 text-black" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="3" /></svg>
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-800"}`}>
                                {v.name}
                              </p>
                              <p className={`mt-0.5 text-xs leading-snug ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                                {v.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-zinc-100 px-6 py-4">
              {/* Community toggle */}
              <label className="mb-4 flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={publishPostToCommunity}
                  onClick={() => setPublishPostToCommunity((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none ${
                    publishPostToCommunity ? "bg-zinc-900" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      publishPostToCommunity ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-zinc-700">Post to CoLabs community</span>
              </label>

              {publishError && <p className="mb-3 text-sm text-red-600">{publishError}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={async () => {
                    setPublishPending(true);
                    setPublishError(null);
                    const spaceTitle = title.trim() || initialData.title || "Untitled";
                    const selectedStyle = publishContentStyle
                      ? CONTENT_STYLES.flatMap((g) => g.variants).find((v) => v.id === publishContentStyle)
                      : null;
                    const result = await publishSpace(spaceId, {
                      title: spaceTitle,
                      summary: selectedStyle ? `${selectedStyle.name} — ${selectedStyle.desc}` : null,
                      visibilityScope: "public",
                    });
                    if (result.ok && publishPostToCommunity) {
                      const communityResult = await publishToCommunity({
                        spaceId,
                        title: spaceTitle,
                        summary: selectedStyle ? selectedStyle.name : undefined,
                      });
                      if (communityResult.ok) {
                        setCommunityPublishId(communityResult.collabId);
                      }
                    }
                    setPublishPending(false);
                    if (result.ok) {
                      setPublishOpen(false);
                      router.refresh();
                    } else {
                      setPublishError(result.error);
                    }
                  }}
                  className="rounded-full border border-black bg-[#00cefc] px-5 py-2 text-sm font-semibold text-black hover:bg-[#00b3dd] disabled:opacity-50"
                >
                  {publishPending ? "Publishing…" : "Publish"}
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
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={() => setPublishOpen(false)}
                  className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                {publishContentStyle && (
                  <button
                    type="button"
                    onClick={() => setPublishContentStyle(null)}
                    className="ml-auto text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
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

// 8-slot color palette: cyan, magenta, yellow, red, blue, green, purple, pink
const AUTHOR_COLORS = [
  "text-cyan-500",
  "text-fuchsia-500",
  "text-yellow-500",
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-purple-500",
  "text-pink-500",
] as const;

function authorColor(authorId: string): string {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = (hash * 31 + authorId.charCodeAt(i)) >>> 0;
  }
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
}

function SpaceChatQuadrant({
  spaceId,
  messages,
  onRefresh,
  className,
}: {
  spaceId: string;
  messages: SpaceMessage[];
  onRefresh: () => void;
  className?: string;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <section className={`flex min-h-0 flex-col bg-zinc-50 p-5 ${className ?? ""}`}>
      <h2 className="text-base font-semibold tracking-tight">chat</h2>
      <div className="mt-3 flex flex-1 min-h-0 flex-col gap-3 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-400">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
                <span className={`font-semibold ${authorColor(m.author_id)}`}>
                  {m.author_display_name?.trim() || "Member"}
                </span>
                <span className="text-zinc-300"> · </span>
                <span className="text-zinc-700">{m.content}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="shrink-0 rounded-lg border border-black bg-[#00cefc] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
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
  className,
}: {
  spaceId: string;
  media: SpaceMedia[];
  onRefresh: () => void;
  storage: NonNullable<SpacePageData>["storage"];
  className?: string;
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
    <section className={`flex min-h-0 flex-col overflow-hidden bg-zinc-50 p-5 ${className ?? ""}`}>
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Media</h2>
          <p className="text-sm text-zinc-500">upload files you'd like to share here</p>
          <div className="mt-0.5 text-xs text-zinc-400">
            {formatBytes(storage.usedBytes)} of {formatBytes(storage.maxBytes)} used
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
            className="rounded-lg border border-black bg-[#00cefc] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {uploading && uploadProgress
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
              : uploading
              ? "Uploading…"
              : "Upload…"}
          </button>
        </div>
      </div>
      {/* Library pill tabs */}
      <div className="mt-3 flex shrink-0 flex-wrap gap-1.5">
        {(["all", "image", "video", "audio", "document"] as const).map((type) => {
          const labels: Record<string, string> = { all: "All media", image: "Photos", video: "Video", audio: "Audio", document: "Documents" };
          const count = type === "all" ? media.length : media.filter((m) => m.type === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === type
                  ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {labels[type]}
              <span className={`rounded-full px-1 text-[10px] tabular-nums ${filter === type ? "bg-white/20 text-zinc-200" : "bg-zinc-100 text-zinc-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row">
        {/* File list */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {media.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-8">
                <p className="text-sm text-zinc-400 text-center">No media yet. Upload files to see them here.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {filter === "all" ? "All items" : filter === "image" ? "Photos" : filter === "video" ? "Video" : filter === "audio" ? "Audio" : "Documents"}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400">
                    <span className="w-7 shrink-0" />
                    <span className="min-w-0 flex-1">Name</span>
                    <span className="w-16 shrink-0">Type</span>
                    <span className="w-20 shrink-0 text-right">Added</span>
                    <span className="w-12 shrink-0 text-right">Share</span>
                  </div>
                  {filteredMedia.map((m) => {
                    const fileName = m.title?.trim() || m.storage_path.split("/").pop() || "Untitled";
                    const isSelected = selected?.id === m.id;
                    const vis = m.visibility ?? "internal";
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                          isSelected ? "bg-[#00cefc]/15" : "odd:bg-white even:bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                            {m.type === "image" ? (
                              <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                            ) : m.type === "video" ? (
                              <svg className="h-4 w-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                            ) : m.type === "audio" ? (
                              <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                            ) : (
                              <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                            )}
                          </span>
                          <span className="min-w-0 truncate font-medium text-zinc-800">{fileName}</span>
                          <span className="w-16 shrink-0 capitalize text-zinc-500">{m.type}</span>
                          <span className="w-20 shrink-0 text-xs text-zinc-400 text-right">
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
                          className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-medium ${
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

        {/* Preview panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 md:mt-0">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Preview</p>
          <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-zinc-400">Select a file to preview it here.</p>
              </div>
            ) : selected.type === "image" ? (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                <img src={selected.publicUrl} alt={selected.title ?? "Media"} className="absolute inset-0 h-full w-full object-contain" />
              </div>
            ) : selected.type === "video" ? (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                <video src={selected.publicUrl} controls className="absolute inset-0 h-full w-full object-contain" />
              </div>
            ) : selected.type === "audio" ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <audio src={selected.publicUrl} controls className="w-full" />
              </div>
            ) : selected.type === "document" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                <svg className="h-12 w-12 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                <p className="text-sm text-zinc-500">PDF Document</p>
                <a href={selected.publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
                  Open PDF ↗
                </a>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Unsupported preview type.</p>
            )}
          </div>
          {selected && (
            <div className="mt-3 shrink-0 space-y-1 border-t border-zinc-100 pt-3">
              <p className="truncate text-sm font-medium text-zinc-800">
                {selected.title?.trim() || selected.storage_path.split("/").pop() || "Untitled"}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{selected.type}</p>
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                Fullscreen
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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

const CMYK_COLUMNS = [
  {
    key: "C" as const,
    label: "A",
    accent: "bg-cyan-400",
    headerText: "text-cyan-700",
    headerBg: "bg-cyan-50",
    border: "border-cyan-200",
    addBtnClass: "border-cyan-400 text-cyan-700 hover:bg-cyan-50",
  },
  {
    key: "M" as const,
    label: "B",
    accent: "bg-fuchsia-400",
    headerText: "text-fuchsia-700",
    headerBg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    addBtnClass: "border-fuchsia-400 text-fuchsia-700 hover:bg-fuchsia-50",
  },
  {
    key: "Y" as const,
    label: "C",
    accent: "bg-yellow-400",
    headerText: "text-yellow-700",
    headerBg: "bg-yellow-50",
    border: "border-yellow-200",
    addBtnClass: "border-yellow-400 text-yellow-700 hover:bg-yellow-50",
  },
  {
    key: "K" as const,
    label: "D",
    accent: "bg-zinc-800",
    headerText: "text-zinc-100",
    headerBg: "bg-zinc-800",
    border: "border-zinc-300",
    addBtnClass: "border-zinc-400 text-zinc-600 hover:bg-zinc-100",
  },
] as const;

type CMYKKey = "C" | "M" | "Y" | "K";

function SpaceBulletinQuadrant({
  spaceId,
  bulletins,
  onRefresh,
  className,
}: {
  spaceId: string;
  bulletins: SpaceBulletin[];
  onRefresh: () => void;
  className?: string;
}) {
  const [addingCol, setAddingCol] = useState<CMYKKey | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  async function handleAdd(col: CMYKKey) {
    if (!newTitle.trim() || pending) return;
    setPending(true);
    const result = await createSpaceBulletin(spaceId, newTitle, null, col);
    setPending(false);
    if (result.ok) {
      setNewTitle("");
      setAddingCol(null);
      onRefresh();
    }
  }

  return (
    <section className={`flex min-h-0 flex-col bg-zinc-50 p-5 ${className ?? ""}`}>
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
      <h2 className="shrink-0 text-base font-semibold tracking-tight">bulletin board</h2>
      <div className="mt-3 flex min-h-0 flex-1 gap-3 overflow-hidden">
        {CMYK_COLUMNS.map((col) => {
          const colBulletins = bulletins.filter((b) => (b.board_column ?? "C") === col.key);
          const isAdding = addingCol === col.key;

          return (
            <div
              key={col.key}
              className={`flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border ${col.border} bg-white overflow-hidden`}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2.5 ${col.headerBg}`}>
                <span className={`text-sm font-bold tracking-widest ${col.headerText}`}>
                  {col.label}
                </span>
                <span className="text-xs text-zinc-400">{colBulletins.length}</span>
              </div>

              {/* Items */}
              <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
                {colBulletins.map((b) => (
                  <div
                    key={b.id}
                    className="group relative flex items-start gap-2 border-b border-zinc-100 px-3 py-2.5 last:border-b-0"
                  >
                    <span className="mt-0.5 text-xs text-zinc-400 shrink-0">•</span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-zinc-700 break-words">
                      {b.title}
                    </p>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === b.id ? null : b.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 transition-opacity"
                      >
                        ···
                      </button>
                      {menuOpenId === b.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-zinc-200 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteSpaceBulletin(spaceId, b.id);
                              setMenuOpenId(null);
                              onRefresh();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Inline add form */}
                {isAdding ? (
                  <div className="border-t border-zinc-100 p-3 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd(col.key);
                        if (e.key === "Escape") { setAddingCol(null); setNewTitle(""); }
                      }}
                      placeholder="Item title…"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdd(col.key)}
                        disabled={pending || !newTitle.trim()}
                        className="flex-1 rounded-lg border border-black bg-[#00cefc] px-2 py-1 text-xs font-semibold text-black disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingCol(null); setNewTitle(""); }}
                        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingCol(col.key); setNewTitle(""); }}
                    className={`m-2.5 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${col.addBtnClass}`}
                  >
                    + New
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function isDueSoon(due: string | null): boolean {
  if (!due) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

const STATUS_STYLES: Record<string, { label: string; pill: string }> = {
  todo:        { label: "Not started", pill: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "In progress", pill: "bg-blue-100 text-blue-700" },
  review:      { label: "Reviewing",   pill: "bg-purple-100 text-purple-700" },
  done:        { label: "Done",        pill: "bg-green-100 text-green-700" },
};

function SpaceTasksQuadrant({
  spaceId,
  tasks,
  members,
  onRefresh,
  className,
}: {
  spaceId: string;
  tasks: SpaceTask[];
  members: SpaceMember[];
  onRefresh: () => void;
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  async function handleAddTask() {
    if (!title.trim() || pending) return;
    setPending(true);
    const result = await createSpaceTask(spaceId, title, null);
    if (result.ok) {
      setTitle("");
      setNewDueDate("");
      setNewAssigneeId("");
      setAddingRow(false);
      onRefresh();
    }
    setPending(false);
  }

  return (
    <section className={`flex min-h-0 flex-col bg-zinc-50 p-5 ${className ?? ""}`}>
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">task board</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          <button
            type="button"
            onClick={() => setAddingRow(true)}
            className="rounded-lg border border-black bg-[#00cefc] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#00b3dd]"
          >
            + New
          </button>
        </div>
      </div>

      {/* Task table */}
      <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_120px_120px_110px_44px] border-b-2 border-zinc-200 bg-zinc-50">
          <span className="border-r border-zinc-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Name</span>
          <span className="border-r border-zinc-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</span>
          <span className="border-r border-zinc-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Assign</span>
          <span className="border-r border-zinc-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Deadline</span>
          <span className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400" />
        </div>

        {/* Task rows */}
        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-zinc-100">
          {tasks.length === 0 && !addingRow && (
            <p className="px-4 py-4 text-sm text-zinc-400">No tasks yet. Hit + New to add one.</p>
          )}

          {tasks.map((t) => {
            const overdue = isOverdue(t.due_date);
            const dueSoon = isDueSoon(t.due_date);
            const statusStyle = STATUS_STYLES[t.status] ?? STATUS_STYLES.todo;

            return (
              <div
                key={t.id}
                className="group grid grid-cols-[1fr_120px_120px_110px_44px] items-stretch hover:bg-zinc-50"
              >
                {/* Name */}
                <div className="flex items-center border-r border-zinc-100 px-3 py-3">
                  <p className={`truncate text-sm font-medium ${t.status === "done" ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                    {t.title}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center border-r border-zinc-100 px-3 py-3">
                  <select
                    value={t.status}
                    onChange={async (e) => {
                      const r = await updateSpaceTaskStatus(spaceId, t.id, e.target.value);
                      if (r.ok) onRefresh();
                    }}
                    className={`cursor-pointer rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${statusStyle.pill}`}
                  >
                    {(["todo", "in_progress", "review", "done"] as const).map((s) => (
                      <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="flex items-center border-r border-zinc-100 px-3 py-3">
                  {members.length > 0 ? (
                    <select
                      value={t.assignee_id ?? ""}
                      onChange={async (e) => {
                        const val = e.target.value || null;
                        const r = await updateSpaceTaskDetails(spaceId, t.id, { assignee_id: val });
                        if (r.ok) onRefresh();
                      }}
                      className="w-full truncate rounded border-0 bg-transparent text-xs text-zinc-600 outline-none hover:bg-zinc-100 px-0.5"
                    >
                      <option value="">—</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.display_name ?? m.id.slice(0, 8)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-zinc-300">—</span>
                  )}
                </div>

                {/* Deadline */}
                <div className="flex items-center border-r border-zinc-100 px-3 py-3">
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
                    className={`w-full rounded border-0 bg-transparent text-xs outline-none hover:bg-zinc-100 ${
                      overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-zinc-500"
                    }`}
                  />
                </div>

                {/* Actions ⋯ */}
                <div className="relative flex items-center justify-center px-2 py-3">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 transition-opacity text-base leading-none"
                  >
                    ···
                  </button>
                  {menuOpenId === t.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-zinc-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteSpaceTask(spaceId, t.id);
                          setMenuOpenId(null);
                          onRefresh();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Inline add row */}
          {addingRow && (
            <div className="grid grid-cols-[1fr_120px_120px_110px_44px] items-stretch border-t border-zinc-100 bg-zinc-50">
              <div className="border-r border-zinc-100 px-3 py-2.5">
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTask();
                    if (e.key === "Escape") { setAddingRow(false); setTitle(""); }
                  }}
                  placeholder="Task name…"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex items-center border-r border-zinc-100 px-3 py-2.5">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500">Not started</span>
              </div>
              <div className="border-r border-zinc-100 px-3 py-2.5">
                {members.length > 0 ? (
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs"
                  >
                    <option value="">—</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.display_name ?? m.id.slice(0, 8)}</option>
                    ))}
                  </select>
                ) : <span />}
              </div>
              <div className="border-r border-zinc-100 px-3 py-2.5">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs"
                />
              </div>
              <div className="flex items-center justify-center gap-1 px-2 py-2.5">
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={pending || !title.trim()}
                  className="rounded-lg border border-black bg-[#00cefc] px-2 py-1 text-xs font-semibold text-black disabled:opacity-50"
                >
                  {pending ? "…" : "✓"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingRow(false); setTitle(""); }}
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* + New row at bottom */}
          {!addingRow && (
            <button
              type="button"
              onClick={() => setAddingRow(true)}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
            >
              + New
            </button>
          )}
        </div>
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
