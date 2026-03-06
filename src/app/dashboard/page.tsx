import Link from "next/link";
import { getUserSpaces } from "@/app/spaces/actions";
import { NewSpaceButton } from "./NewSpaceButton";

export default async function DashboardPage() {
  const spaces = await getUserSpaces();

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground md:px-12 md:py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Your work at a glance</h1>
        </div>
        <div className="flex gap-2 text-sm">
          <NewSpaceButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-1">
        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Spaces</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Spaces are collaboration rooms where chat, media, bulletins, and tasks live together.
          </p>
          {spaces.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-background/60 p-4 text-xs text-zinc-500">
              No spaces yet. Use &quot;New space&quot; to start collaborating.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border-subtle)] bg-background/80 px-4 py-3 text-sm hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {space.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {space.memberCount}{" "}
                      {space.memberCount === 1 ? "person" : "people"} ·{" "}
                      {space.updatedAt
                        ? `Updated ${new Date(space.updatedAt).toLocaleDateString()}`
                        : "Recently created"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-zinc-500">
                    Open
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

