"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollaborationListing } from "../actions";
import {
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_GROUPS,
  type ListingCategory,
} from "../categories";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<ListingCategory>>(new Set());
  const [rolesNeeded, setRolesNeeded] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleCategory(cat: ListingCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createCollaborationListing({
        title: title.trim(),
        description: description.trim(),
        categories: Array.from(selectedCategories),
        rolesNeeded: rolesNeeded.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/community/listings/${result.listingId}`);
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-background px-6 py-12 text-foreground">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 self-start text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-700"
      >
        ← Community
      </button>
      <h1 className="text-2xl font-semibold tracking-tight">New collaboration listing</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Describe the collaboration you&apos;re starting. A space will be created for this listing
        and collaborators you accept will be added to it.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-7">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Looking for a vocalist for an indie EP…"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 h-28 w-full resize-none rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Share what you're working on, what stage you're at, and any expectations for collaborators."
          />
        </div>

        {/* Categories — Tinder-style multi-select */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Categories
            </label>
            {selectedCategories.size > 0 && (
              <span className="text-[11px] text-[#00cefc] font-medium">
                {selectedCategories.size} selected
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Select all that apply — these help people find your listing.
          </p>

          <div className="mt-3 space-y-4">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.keys.map((cat) => {
                    const selected = selectedCategories.has(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-[#00cefc] bg-[#00cefc] text-black shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles needed */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Roles needed
          </label>
          <input
            type="text"
            value={rolesNeeded}
            onChange={(e) => setRolesNeeded(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g. Drummer, vocalist, graphic designer…"
          />
          <p className="mt-1 text-[11px] text-zinc-400">
            Describe the specific roles or skills you&apos;re looking for.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-[color:var(--border-subtle)] px-4 py-1.5 text-sm font-medium hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create listing"}
          </button>
        </div>
      </form>
    </main>
  );
}
