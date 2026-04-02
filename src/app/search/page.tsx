import Link from "next/link";
import { searchCommunityListings } from "@/app/community/actions";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchCommunityListings(query) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-background px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        Find open collaboration listings by title or description.
      </p>

      <form action="/search" method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Keywords…"
          className="min-w-[200px] flex-1 rounded-full border border-[color:var(--border-subtle)] bg-white px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full border border-black bg-[#00cefc] px-5 py-2 text-sm font-semibold text-black hover:bg-[#00b3dd]"
        >
          Search
        </button>
      </form>

      {query && (
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          {results.length === 0 ? (
            <p className="text-sm text-zinc-600">No listings match that search.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/community/listings/${row.id}`}
                    className="block rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3 hover:bg-zinc-50"
                  >
                    <p className="font-medium">{row.title}</p>
                    {row.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{row.description}</p>
                    )}
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {row.ownerName ?? "Creator"} · {row.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
