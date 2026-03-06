import { NewSpaceButton } from "./NewSpaceButton";

export default function DashboardPage() {
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
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-background/60 p-4 text-xs text-zinc-500">
            No spaces yet. Use &quot;New space&quot; to start collaborating.
          </div>
        </div>
      </section>
    </main>
  );
}

