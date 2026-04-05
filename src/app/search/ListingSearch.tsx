"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_GROUPS,
  LISTING_CATEGORIES,
  getCategoryGroupImages,
  type ListingCategory,
} from "@/app/community/categories";
import { type CommunityListingSummary } from "@/app/community/actions";

// ── helpers ─────────────────────────────────────────────────────────────────

function matchesQuery(cat: ListingCategory, query: string) {
  const label = CATEGORY_LABELS[cat].toLowerCase();
  const key = cat.toLowerCase();
  const q = query.toLowerCase();
  return label.includes(q) || key.includes(q);
}

// ── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: CommunityListingSummary }) {
  const images = getCategoryGroupImages(listing.categories);
  return (
    <Link
      href={`/community/listings/${listing.id}`}
      className="block overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 hover:bg-zinc-50 transition-colors"
    >
      {/* Split category image header */}
      {images.length > 0 && (
        <div className="flex h-36 w-full overflow-hidden">
          {images.map((src, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i > 0 && (
                <div className="absolute inset-y-0 left-0 w-px bg-white/40" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Card content */}
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold tracking-tight">{listing.title}</p>
            {listing.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500"
              >
                {CATEGORY_LABELS[cat as ListingCategory] ?? cat}
              </span>
            ))}
            {listing.categories.length > 3 && (
              <span className="text-[10px] text-zinc-400">
                +{listing.categories.length - 3} more
              </span>
            )}
          </div>
          {listing.description && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{listing.description}</p>
          )}
          {listing.rolesNeeded && (
            <p className="mt-1 text-[11px] text-zinc-500 italic">
              Looking for: {listing.rolesNeeded}
            </p>
          )}
          <p className="mt-1.5 text-[11px] text-zinc-400">
            By {listing.ownerName ?? "someone"} · Open
          </p>
        </div>
        <div className="shrink-0 text-right text-[11px] text-zinc-400">
          <span className="block">
            {listing.applicationCount}{" "}
            {listing.applicationCount === 1 ? "applicant" : "applicants"}
          </span>
          {listing.createdAt && (
            <span className="block mt-0.5">
              {new Date(listing.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ListingSearch({
  initialListings,
}: {
  initialListings: CommunityListingSummary[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ListingCategory[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Categories matching the search query, excluding already-selected ones
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return LISTING_CATEGORIES.filter(
      (cat) => !selected.includes(cat) && matchesQuery(cat, query.trim())
    );
  }, [query, selected]);

  // Group suggestions for dropdown display
  const groupedSuggestions = useMemo(() => {
    if (suggestions.length === 0) return [];
    return CATEGORY_GROUPS.map((group) => ({
      label: group.label,
      cats: group.keys.filter((k) => suggestions.includes(k)),
    })).filter((g) => g.cats.length > 0);
  }, [suggestions]);

  // Filter listings: if categories are selected, only show listings that have at least one
  const filtered = useMemo(() => {
    if (selected.length === 0) return initialListings;
    return initialListings.filter((listing) =>
      listing.categories.some((cat) => selected.includes(cat as ListingCategory))
    );
  }, [selected, initialListings]);

  function addCategory(cat: ListingCategory) {
    if (!selected.includes(cat)) setSelected((prev) => [...prev, cat]);
    setQuery("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  }

  function removeCategory(cat: ListingCategory) {
    setSelected((prev) => prev.filter((c) => c !== cat));
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setDropdownOpen(value.trim().length > 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setDropdownOpen(false);
      setQuery("");
    }
    if (e.key === "Backspace" && !query && selected.length > 0) {
      setSelected((prev) => prev.slice(0, -1));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 bg-background px-6 py-12 text-foreground">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Find Collaborations</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Search by category to discover open listings looking for your skills.
          </p>
        </div>
        <Link
          href="/community/new"
          className="shrink-0 rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
        >
          Post a listing
        </Link>
      </div>

      {/* Search input with category pills */}
      <div ref={containerRef} className="relative">
        <div
          className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-white px-4 py-2 focus-within:border-zinc-400 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Selected category pills */}
          {selected.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-white"
            >
              {CATEGORY_LABELS[cat]}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCategory(cat);
                }}
                className="ml-0.5 rounded-full text-zinc-400 hover:text-white focus:outline-none"
                aria-label={`Remove ${CATEGORY_LABELS[cat]}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* Text input */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setDropdownOpen(true)}
            placeholder={selected.length === 0 ? "Search categories…" : "Add another…"}
            autoComplete="off"
            className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Suggestions dropdown */}
        {dropdownOpen && groupedSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-[color:var(--border-subtle)] bg-white shadow-lg">
            {groupedSuggestions.map((group) => (
              <div key={group.label}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  {group.label}
                </p>
                {group.cats.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent blur before click
                      addCategory(cat);
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* No matches */}
        {dropdownOpen && query.trim() && groupedSuggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1.5 rounded-2xl border border-[color:var(--border-subtle)] bg-white px-4 py-3 shadow-lg">
            <p className="text-sm text-zinc-400">No matching categories for &ldquo;{query}&rdquo;.</p>
          </div>
        )}
      </div>

      {/* Active filter summary + clear */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 -mt-3">
          <p className="text-xs text-zinc-500">
            Filtering by <span className="font-semibold text-zinc-700">{selected.length}</span>{" "}
            {selected.length === 1 ? "category" : "categories"}
          </p>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results feed */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-800">
          {selected.length === 0
            ? `All listings (${filtered.length})`
            : `${filtered.length} ${filtered.length === 1 ? "listing" : "listings"} found`}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-white/70 p-8 text-center">
            <p className="text-sm text-zinc-500">
              No listings match{" "}
              {selected.map((c) => CATEGORY_LABELS[c]).join(", ")}.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Try a different category or{" "}
              <Link href="/community/new" className="underline underline-offset-2 hover:text-zinc-600">
                post your own listing
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
