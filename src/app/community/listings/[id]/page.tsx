import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getListingDetail, createListingApplication } from "../../actions";

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
        className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-700"
      >
        ← Community
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{listing.title}</h1>
      {listing.description && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-700">{listing.description}</p>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        {listing.ownerName ? `Created by ${listing.ownerName}` : "Collaboration listing"} ·{" "}
        {listing.status === "open" ? "Open to applications" : "Closed"}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3 text-sm">
        <div className="min-w-0">
          <p className="font-medium">Collaboration space</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            A dedicated space will host chat, media, bulletins, and tasks for this collaboration.
          </p>
        </div>
        <Link
          href={`/spaces/${listing.spaceId}`}
          className="shrink-0 rounded-full border border-[color:var(--border-subtle)] px-3 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          View space
        </Link>
      </div>

      {!userId ? (
        <div className="mt-8 rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3 text-sm">
          <p className="text-sm text-zinc-700">
            Sign in to apply to this collaboration. You&apos;ll be redirected back here after you
            sign in.
          </p>
          <Link
            href={`/sign-in?redirect_url=/community/listings/${listing.id}`}
            className="mt-3 inline-flex rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
          >
            Sign in to apply
          </Link>
        </div>
      ) : listing.isOwner ? (
        <p className="mt-8 text-xs text-zinc-500">
          You created this listing. Applicants will appear in your dashboard under Applications.
        </p>
      ) : (
        <ApplySection listingId={listing.id} />
      )}
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
    <form action={apply} className="mt-8 space-y-3">
      <p className="text-sm font-medium">Apply to join this collaboration</p>
      <textarea
        name="message"
        className="h-28 w-full resize-none rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
        placeholder="Share a short note about who you are and how you’d like to contribute."
      />
      <button
        type="submit"
        className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
      >
        Apply
      </button>
      <p className="text-[11px] text-zinc-500">
        Your application will appear in your dashboard under Applications (sent), and the listing
        owner will see it under Applications (received).
      </p>
    </form>
  );
}

