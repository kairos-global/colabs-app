import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getListingDetail, createListingApplication, CATEGORY_LABELS } from "../../actions";
import type { ListingCategory } from "../../actions";

type ListingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingDetail(id);
  if (!listing) {
    redirect("/community");
  }

  const { userId } = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-background px-6 py-12 text-foreground">
      <Link
        href="/community"
        className="mb-6 self-start text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-700"
      >
        ← Community
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
      {listing.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[#00cefc]/40 bg-[#00cefc]/10 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
            >
              {CATEGORY_LABELS[cat as ListingCategory] ?? cat}
            </span>
          ))}
        </div>
      )}

      <p className="mt-1 text-xs text-zinc-500">
        Posted by{" "}
        {listing.ownerProfileId ? (
          <Link
            href={`/profile/${listing.ownerProfileId}`}
            className="font-medium text-zinc-700 hover:underline"
          >
            {listing.ownerName ?? "someone"}
          </Link>
        ) : (
          <span className="font-medium text-zinc-700">{listing.ownerName ?? "someone"}</span>
        )}{" "}
        ·{" "}
        {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : ""}
        {" · "}
        <span
          className={
            listing.status === "open" ? "text-green-600 font-medium" : "text-zinc-400 font-medium"
          }
        >
          {listing.status === "open" ? "Open to applicants" : "Closed"}
        </span>
      </p>

      {listing.description && (
        <p className="mt-5 text-sm leading-relaxed text-zinc-700">{listing.description}</p>
      )}

      {listing.rolesNeeded && (
        <div className="mt-5 rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            Looking for
          </p>
          <p className="mt-1 text-sm text-zinc-700">{listing.rolesNeeded}</p>
        </div>
      )}

      <div className="mt-8 border-t border-[color:var(--border-subtle)] pt-8">
        {!userId ? (
          <div className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-5">
            <p className="text-sm text-zinc-700">
              Sign in to apply to this collaboration.
            </p>
            <Link
              href={`/sign-in?redirect_url=/community/listings/${listing.id}`}
              className="mt-3 inline-flex rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
            >
              Sign in to apply
            </Link>
          </div>
        ) : listing.isOwner ? (
          <div className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-4">
            <p className="text-sm font-medium text-zinc-700">You created this listing</p>
            <p className="mt-1 text-xs text-zinc-500">
              Applications from other users will appear in your Dashboard under Applications
              (received).
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-flex rounded-full border border-[color:var(--border-subtle)] px-3 py-1 text-xs font-medium hover:bg-zinc-100"
            >
              View dashboard →
            </Link>
          </div>
        ) : listing.status !== "open" ? (
          <p className="text-sm text-zinc-500">This listing is closed to new applications.</p>
        ) : (
          <ApplySection listingId={listing.id} />
        )}
      </div>
    </main>
  );
}

function ApplySection({ listingId }: { listingId: string }) {
  async function apply(formData: FormData) {
    "use server";
    const message = (formData.get("message") as string | null) ?? undefined;
    await createListingApplication({ listingId, message });
  }

  return (
    <form action={apply} className="space-y-3">
      <p className="text-sm font-semibold">Apply to join this collaboration</p>
      <p className="text-xs text-zinc-500">
        Share a short note about who you are and how you&apos;d like to contribute.
      </p>
      <textarea
        name="message"
        className="h-28 w-full resize-none rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        placeholder="I'm a drummer based in LA with 5 years of session experience…"
      />
      <button
        type="submit"
        className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
      >
        Send application
      </button>
      <p className="text-[11px] text-zinc-400">
        Your application will appear in your Dashboard under Applications (sent).
      </p>
    </form>
  );
}
