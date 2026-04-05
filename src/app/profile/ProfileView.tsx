"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";
import { UploadProfileMediaModal } from "@/components/UploadProfileMediaModal";
import { ProfileItemDetailModal, type DetailItem } from "@/components/ProfileItemDetailModal";
import type { ProfilePageData, ProfileMediaWithUrl } from "@/app/profile/actions";
import type { PublishedCollab } from "@/lib/profile";

type ProfileViewProps = {
  data: ProfilePageData;
};

function Avatar({ name, url, size = 96 }: { name: string | null; url: string | null; size?: number }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "avatar"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-[color:var(--border-subtle)] shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-bold text-white"
    >
      {initial}
    </div>
  );
}

export function ProfileView({ data }: ProfileViewProps) {
  const { profile, profileMedia, publishedCollabs } = data;
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "collabs">("posts");
  const [signingOut, setSigningOut] = useState(false);

  const { signOut } = useClerk();
  const router = useRouter();

  const posts = profileMedia.filter((m) => m.type === "image");
  const videos = profileMedia.filter((m) => m.type === "video");

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ redirectUrl: "/" });
    router.push("/");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-background px-4 py-8 text-foreground md:px-6 md:py-12">

      {editOpen && profile && (
        <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} />
      )}
      {uploadOpen && <UploadProfileMediaModal onClose={() => setUploadOpen(false)} />}
      <ProfileItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />

      {/* ── Profile hero ── */}
      <section className="flex flex-col gap-6">

        {/* Avatar row */}
        <div className="flex items-start gap-5 sm:gap-7">
          <Avatar
            name={profile?.display_name ?? null}
            url={profile?.avatar_url ?? null}
            size={96}
          />

          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {profile?.display_name?.trim() || (
                <span className="text-zinc-400">Your name</span>
              )}
            </h1>

            {profile?.bio?.trim() ? (
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 sm:text-base">
                {profile.bio.trim()}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-zinc-400">No bio yet</p>
            )}

            {profile?.url?.trim() && (
              <a
                href={profile.url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-[#00cefc] hover:underline"
              >
                {profile.url.trim()}
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-full border border-black bg-background px-4 py-1.5 font-medium hover:bg-zinc-100"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
          >
            Upload media
          </button>
          {profile && (
            <a
              href={`/profile/${profile.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-300 bg-background px-4 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Public page ↗
            </a>
          )}

          {/* Spacer pushes sign out to the right */}
          <div className="flex-1" />

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-full border border-zinc-200 bg-background px-4 py-1.5 font-medium text-zinc-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[color:var(--border-subtle)]" />
      </section>

      {/* ── Tabs ── */}
      <section className="mt-6 flex flex-col gap-5">
        <div
          className="flex overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100"
          role="tablist"
        >
          {(
            [
              { id: "posts" as const, label: "Posts", count: posts.length },
              { id: "video" as const, label: "Video", count: videos.length },
              { id: "collabs" as const, label: "Collabs", count: publishedCollabs.length },
            ] as const
          ).map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors
                ${i > 0 ? "border-l border-[color:var(--border-subtle)]" : ""}
                ${activeTab === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none
                  ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[160px]">
          {activeTab === "posts" && (
            <TabContentPosts
              items={posts}
              onDetail={(item) => setDetailItem({ type: "media", item })}
            />
          )}
          {activeTab === "video" && (
            <TabContentVideos
              items={videos}
              onDetail={(item) => setDetailItem({ type: "media", item })}
            />
          )}
          {activeTab === "collabs" && (
            <TabContentCollabs
              items={publishedCollabs}
              onDetail={(item) => setDetailItem({ type: "collab", item })}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ── Tab content helpers ───────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-zinc-50 py-14 text-sm text-zinc-400">
      {message}
    </div>
  );
}

function TabContentPosts({
  items,
  onDetail,
}: {
  items: ProfileMediaWithUrl[];
  onDetail: (item: ProfileMediaWithUrl) => void;
}) {
  if (items.length === 0) return <EmptyState message="No posts yet — upload some media to get started." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onDetail(item)}
          className="group relative aspect-square overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100"
        >
          <img src={item.publicUrl} alt={item.caption ?? "Post"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
        </button>
      ))}
    </div>
  );
}

function TabContentVideos({
  items,
  onDetail,
}: {
  items: ProfileMediaWithUrl[];
  onDetail: (item: ProfileMediaWithUrl) => void;
}) {
  if (items.length === 0) return <EmptyState message="No videos yet — upload a video to get started." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onDetail(item)}
          className="group relative aspect-square overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100"
        >
          <video src={item.publicUrl} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow">
              <span className="ml-0.5 text-black">▶</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function TabContentCollabs({
  items,
  onDetail,
}: {
  items: PublishedCollab[];
  onDetail: (item: PublishedCollab) => void;
}) {
  if (items.length === 0) return <EmptyState message="No published collabs yet." />;
  return (
    <div className="space-y-2">
      {items.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onDetail(c)}
          className="flex w-full items-start justify-between gap-4 rounded-2xl border border-[color:var(--border-subtle)] bg-white px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{c.title}</p>
            {c.summary && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{c.summary}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-zinc-400">View →</span>
        </button>
      ))}
    </div>
  );
}
