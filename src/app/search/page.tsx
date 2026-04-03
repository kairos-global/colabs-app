"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useTransition } from "react";
import { searchUsers, type UserSearchResult } from "@/app/community/actions";

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name ?? "user"} className="h-10 w-10 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
      {initials}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchUsers(query.trim());
        setResults(data);
        setSearched(true);
      });
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-background px-6 py-12 text-foreground">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Find people on CoLabs by name.
        </p>
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          autoComplete="off"
          autoFocus
          className="w-full rounded-full border border-[color:var(--border-subtle)] bg-white px-5 py-2.5 text-sm outline-none focus:border-zinc-400"
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
          </div>
        )}
      </div>

      {searched && (
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {results.length} {results.length === 1 ? "person" : "people"} found
          </p>

          {results.length === 0 ? (
            <p className="text-sm text-zinc-500">No users match &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3 transition-colors hover:bg-zinc-50"
                  >
                    <Avatar name={user.displayName} url={user.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-800">
                        {user.displayName ?? "No name"}
                      </p>
                      {user.bio && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{user.bio}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">View profile →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!query && (
        <p className="text-sm text-zinc-400">Start typing to find people on CoLabs.</p>
      )}
    </main>
  );
}
