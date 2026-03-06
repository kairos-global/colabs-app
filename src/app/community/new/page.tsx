"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollaborationListing } from "../actions";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      <h1 className="text-2xl font-semibold tracking-tight">New collaboration listing</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Describe the collaboration you&apos;re starting. A space will be created for this listing,
        and collaborators you accept can be added to that space.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
            placeholder="Looking for collaborators for..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 h-32 w-full resize-none rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
            placeholder="Share what you’re working on, what you need help with, and any expectations."
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
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

