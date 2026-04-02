"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicProfilePageData, PublicProfileMediaWithUrl } from "./page";
import type { PublishedCollab } from "@/lib/profile";

export function PublicProfileView({ data }: { data: PublicProfilePageData }) {
  const { profile, profileMedia, publishedCollabs } = data;
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "collabs">("posts");

  const posts = profileMedia.filter((m) => m.type === "image");
  const videos = profileMedia.filter((m) => m.type === "video");

  const tabs = [
    { id: "posts" as const, label: "Posts", count: posts.length },
    { id: "video" as const, label: "Video", count: videos.length },
    { id: "collabs" as const, label: "Collabs", count: publishedCollabs.length },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-background px-4 py-5 text-foreground md:gap-6 md:px-6 md:py-10">
      {/* Back to CoLabs */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          CoLabs
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00b3dd]"
        >
          Join CoLabs
        </Link>
      </div>

      {/* Profile card */}
      <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-sidebar p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? "Profile picture"}
                className="h-28 w-28 rounded-full border border-[color:var(--border-subtle)] object-cover sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-black text-center text-xs font-medium text-white sm:h-32 sm:w-32">
                {profile.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              {profile.display_name?.trim() || "Creator"}
            </p>
            {profile.bio?.trim() && (
              <p className="text-sm leading-relaxed text-zinc-600">{profile.bio.trim()}</p>
            )}
            {profile.url?.trim() && (
              <a
                href={profile.url.trim().startsWith("http") ? profile.url.trim() : `https://${profile.url.trim()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[#00cefc] hover:underline"
              >
                {profile.url.trim()}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}

            {/* Stats row */}
            <div className="flex gap-5 pt-1 text-sm">
              <span className="font-semibold text-foreground">{posts.length + videos.length} <span className="font-normal text-zinc-500">posts</span></span>
              <span className="font-semibold text-foreground">{publishedCollabs.length} <span className="font-normal text-zinc-500">collabs</span></span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 border-t border-[color:var(--border-subtle)] pt-4 md:mt-6">
          <div
            className="flex overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-zinc-200/80"
            role="tablist"
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium transition-colors",
                  i === 0 ? "rounded-l-lg" : "",
                  i === tabs.length - 1 ? "rounded-r-lg" : "",
                  activeTab === tab.id
                    ? "bg-[#00cefc] text-white"
                    : "bg-white text-foreground hover:bg-zinc-50",
                  i < tabs.length - 1 && activeTab !== tab.id
                    ? "border-r border-[color:var(--border-subtle)]"
                    : "",
                ].join(" ")}
              >
                {tab.label}
                <span className={`text-xs ${activeTab === tab.id ? "text-white/70" : "text-zinc-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[120px]">
            {activeTab === "posts" && (
              <MediaGrid items={posts} emptyMessage="No posts yet." />
            )}
            {activeTab === "video" && (
              <VideoGrid items={videos} emptyMessage="No videos yet." />
            )}
            {activeTab === "collabs" && (
              <CollabsGrid items={publishedCollabs} emptyMessage="No published collabs yet." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MediaGrid({ items, emptyMessage }: { items: PublicProfileMediaWithUrl[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
        {emptyMessage}
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
          className="group block aspect-square overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100"
        >
          <img
            src={item.publicUrl}
            alt={item.caption ?? "Post"}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}

function VideoGrid({ items, emptyMessage }: { items: PublicProfileMediaWithUrl[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100">
          <video
            src={item.publicUrl}
            controls
            className="aspect-video w-full object-cover"
          />
          {item.caption && (
            <p className="p-2 text-xs text-zinc-600">{item.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function CollabsGrid({ items, emptyMessage }: { items: PublishedCollab[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--border-subtle)] bg-zinc-200/60 p-6 text-center text-sm text-zinc-600">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/published/${c.id}`}
          className="group flex flex-col justify-between gap-3 rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100 p-4 transition hover:border-[#00cefc] hover:bg-white"
        >
          <div className="min-w-0">
            <p className="font-semibold text-foreground group-hover:text-[#00cefc]">{c.title}</p>
            {c.summary && (
              <p className="mt-1 text-sm leading-snug text-zinc-600">{c.summary}</p>
            )}
            {c.published_at && (
              <p className="mt-2 text-xs text-zinc-400">
                {new Date(c.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
          <span className="self-start text-xs font-medium text-[#00cefc]">View collab →</span>
        </Link>
      ))}
    </div>
  );
}
