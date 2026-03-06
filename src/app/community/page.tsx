import Link from "next/link";
import { getCommunityListings } from "./actions";

export default async function CommunityPage() {
  const listings = await getCommunityListings();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-background px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        The Community board is where you can post collaboration listings, find partners, and
        surface active spaces.
      </p>
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Collaboration listings
        </p>
        <Link
          href="/community/new"
          className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
        >
          New collaboration listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-white/70 p-6 text-sm text-zinc-600">
          No collaboration listings yet. Create one to find collaborators for a new space.
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/community/listings/${listing.id}`}
              className="block rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 px-5 py-4 hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {listing.title}
                  </p>
                  {listing.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                      {listing.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {listing.ownerName ? `By ${listing.ownerName}` : "Collaboration listing"} ·{" "}
                    {listing.status === "open" ? "Open" : "Closed"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-zinc-500">
                  {listing.applicationCount}{" "}
                  {listing.applicationCount === 1 ? "application" : "applications"}
                  <br />
                  {listing.createdAt
                    ? new Date(listing.createdAt).toLocaleDateString()
                    : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
