type SpaceWorkspacePageProps = {
  params: {
    id: string;
  };
};

export default function SpaceWorkspacePage({ params }: SpaceWorkspacePageProps) {
  const { id } = params;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-6 py-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Space
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            Untitled space <span className="text-xs font-normal text-zinc-500">/ {id}</span>
          </h1>
        </div>
        <button className="rounded-full border border-[color:var(--border-subtle)] bg-white px-4 py-1.5 text-sm font-medium hover:bg-zinc-100">
          Publish
        </button>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2 md:grid-rows-2">
        <section className="flex flex-col rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Chat</h2>
            <span className="rounded-full border border-[color:var(--border-subtle)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Internal
            </span>
          </header>
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-500">
            Chat stream placeholder. Messages live here.
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Media Bank</h2>
            <span className="rounded-full border border-[color:var(--border-subtle)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Internal / External
            </span>
          </header>
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-500">
            Uploads and reference media will appear here.
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Bulletin Board</h2>
            <span className="rounded-full border border-[color:var(--border-subtle)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Internal / External
            </span>
          </header>
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-500">
            Pinned notes, announcements, and context live here.
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Task Board</h2>
            <span className="rounded-full border border-[color:var(--border-subtle)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Internal / External
            </span>
          </header>
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-500">
            Tasks and boards will show up here.
          </div>
        </section>
      </main>
    </div>
  );
}

