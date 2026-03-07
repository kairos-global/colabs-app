import Link from "next/link";
import { getUserSpaces } from "./actions";
import { NewSpaceButton } from "@/app/dashboard/NewSpaceButton";

export default async function SpacesPage() {
  const spaces = await getUserSpaces();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Spaces</h1>
        <NewSpaceButton />
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
          Spaces are dedicated workrooms for a single collaboration. Chat with collaborators, share
          media, pin bulletins, and track tasks in one shared layout.
        </p>

        {spaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-white/70 p-8">
            <p className="text-sm font-medium text-zinc-700">
              You don&apos;t have any spaces yet.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Create a space to start a collaboration. You can invite collaborators, upload media,
              and publish a read-only view when you&apos;re ready to share your work.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <NewSpaceButton />
              <Link
                href="/"
                className="rounded-full border border-[color:var(--border-subtle)] bg-white px-4 py-1.5 font-medium text-foreground hover:bg-zinc-100"
              >
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3 text-sm hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{space.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {space.memberCount}{" "}
                    {space.memberCount === 1 ? "person" : "people"} ·{" "}
                    {space.updatedAt
                      ? `Updated ${new Date(space.updatedAt).toLocaleDateString()}`
                      : "Recently created"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-zinc-500">Open</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

