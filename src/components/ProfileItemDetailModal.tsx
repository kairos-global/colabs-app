"use client";

import type { ProfileMediaWithUrl } from "@/app/profile/actions";
import type { PublishedCollab } from "@/lib/profile";

export type DetailItem =
  | { type: "media"; item: ProfileMediaWithUrl }
  | { type: "collab"; item: PublishedCollab };

type ProfileItemDetailModalProps = {
  item: DetailItem | null;
  onClose: () => void;
};

export function ProfileItemDetailModal({ item, onClose }: ProfileItemDetailModalProps) {
  if (!item) return null;

  const title =
    item.type === "media"
      ? (item.item.caption?.trim() || (item.item.type === "image" ? "Post" : "Video"))
      : item.item.title;
  const description =
    item.type === "media" ? null : (item.item.summary?.trim() || null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-zinc-600">{description}</p>
        )}
        {item.type === "media" && (
          <div className="mt-4">
            {item.item.type === "image" ? (
              <img
                src={item.item.publicUrl}
                alt={item.item.caption ?? "Post"}
                className="w-full rounded-xl border border-[color:var(--border-subtle)] object-cover"
              />
            ) : (
              <video
                src={item.item.publicUrl}
                controls
                className="w-full rounded-xl border border-[color:var(--border-subtle)]"
              />
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
