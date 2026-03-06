"use client";

import { useState } from "react";
import { EditProfileModal } from "@/components/EditProfileModal";
import { UploadProfileMediaModal } from "@/components/UploadProfileMediaModal";
import type { ProfilePageData, ProfileMediaWithUrl } from "@/app/profile/actions";
import type { PublishedCollab } from "@/lib/profile";

type ProfileViewProps = {
  data: ProfilePageData;
};

export function ProfileView({ data }: ProfileViewProps) {
  const { profile, profileMedia, publishedCollabs } = data;
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "collabs">("posts");

  const posts = profileMedia.filter((m) => m.type === "image");
  const videos = profileMedia.filter((m) => m.type === "video");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background px-6 py-8 text-foreground md:py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        {profile && (
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full border border-black bg-background px-4 py-1.5 font-medium hover:bg-zinc-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
            >
              Upload media
            </button>
          </div>
        )}
      </header>

      {editOpen && profile && (
        <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} />
      )}
      {uploadOpen && <UploadProfileMediaModal onClose={() => setUploadOpen(false)} />}

      {/* Profile card */}
      <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-zinc-100/80 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-24 w-24 rounded-full border border-[color:var(--border-subtle)] object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black text-center text-xs font-medium text-white sm:h-28 sm:w-28">
                profile picture
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-base font-medium text-foreground">
              {profile?.display_name?.trim() || "name"}
            </p>
            <p className="text-sm text-zinc-600">
              {profile?.bio?.trim() || "bio"}
            </p>
            <p className="text-sm text-zinc-600">
              {profile?.url?.trim() || "url"}
            </p>
          </div>
        </div>

        {/* Tabs: unified pill, cyan active */}
        <div className="mt-6 border-t border-[color:var(--border-subtle)] pt-4">
          <div
            className="flex overflow-hidden rounded-full border border-[color:var(--border-subtle)] bg-zinc-200/80"
            role="tablist"
          >
            {(
              [
                { id: "posts" as const, label: "Posts" },
                { id: "video" as const, label: "Video" },
                { id: "collabs" as const, label: "Collabs" },
              ] as const
            ).map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  i === 0 ? "rounded-l-full" : ""
                } ${i === 2 ? "rounded-r-full" : ""} ${
                  activeTab === tab.id
                    ? "bg-[#00cefc] text-white"
                    : "bg-white text-foreground hover:bg-zinc-50"
                } ${i < 2 && activeTab !== tab.id ? "border-r border-[color:var(--border-subtle)]" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[120px]">
            {activeTab === "posts" && (
              <TabContentPosts
                items={posts}
                emptyMessage="display either posts, videos, or collabs here, whichever tab is selected"
              />
            )}
            {activeTab === "video" && (
              <TabContentVideos
                items={videos}
                emptyMessage="display either posts, videos, or collabs here, whichever tab is selected"
              />
            )}
            {activeTab === "collabs" && (
              <TabContentCollabs
                items={publishedCollabs}
                emptyMessage="display either posts, videos, or collabs here, whichever tab is selected"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TabContentPosts({
  items,
  emptyMessage,
}: {
  items: ProfileMediaWithUrl[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100"
        >
          <img src={item.publicUrl} alt={item.caption ?? "Post"} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function TabContentVideos({
  items,
  emptyMessage,
}: {
  items: ProfileMediaWithUrl[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100">
          <video src={item.publicUrl} controls className="w-full" />
          {item.caption && <p className="p-2 text-sm text-zinc-600">{item.caption}</p>}
        </div>
      ))}
    </div>
  );
}

function TabContentCollabs({
  items,
  emptyMessage,
}: {
  items: PublishedCollab[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
          {emptyMessage}
        </div>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-[color:var(--border-subtle)] bg-background p-4"
        >
          <p className="font-medium text-foreground">{c.title}</p>
          {c.summary && <p className="mt-1 text-sm text-zinc-600">{c.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
