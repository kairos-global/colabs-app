import Link from "next/link";
import { getCommunityListings, getCommunityPublishedCollabs } from "./actions";
import { CATEGORY_LABELS, getCategoryGroupImages, type ListingCategory } from "./categories";

export default async function CommunityPage() {
  const [listings, publishedCollabs] = await Promise.all([
    getCommunityListings(),
    getCommunityPublishedCollabs(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 bg-background px-6 py-12 text-foreground">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Find collaborators, browse open listings, and discover finished work from CoLabs teams.
        </p>
      </div>

      {/* ── Collaboration Listings ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-800">
            Collaboration Listings
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
            No open collaboration listings yet. Be the first to post one.
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => {
              const images = getCategoryGroupImages(listing.categories);
              return (
                <Link
                  key={listing.id}
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
                          <span key={cat} className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                            {CATEGORY_LABELS[cat as ListingCategory] ?? cat}
                          </span>
                        ))}
                      </div>
                      {listing.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                          {listing.description}
                        </p>
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
                      <span className="block mt-0.5">
                        {listing.createdAt
                          ? new Date(listing.createdAt).toLocaleDateString()
                          : null}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Published Collaborations ── */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-800">
          Published Collaborations
        </p>

        {publishedCollabs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-white/70 p-6 text-sm text-zinc-600">
            No published collaborations yet. Teams can post finished work from their space.
          </div>
        ) : (
          <div className="space-y-2">
            {publishedCollabs.map((collab) => (
              <Link
                key={collab.id}
                href={`/community/collabs/${collab.id}`}
                className="block rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 px-5 py-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-tight">{collab.title}</p>
                    {collab.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{collab.summary}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-zinc-400">
                      By {collab.publisherName ?? "a team"} ·{" "}
                      {collab.memberCount} {collab.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-zinc-400">
                    {new Date(collab.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
