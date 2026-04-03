import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedCollabDetail } from "../../actions";

type CollabDetailPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  todo: "Not started",
  "in-progress": "In progress",
  review: "Reviewing",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-zinc-100 text-zinc-500",
  "in-progress": "bg-blue-50 text-blue-600",
  review: "bg-amber-50 text-amber-600",
  done: "bg-green-50 text-green-600",
};

const COLUMN_LABELS: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  // Legacy CMYK keys
  C_OLD: "C",
  M: "M",
  Y: "Y",
  K: "K",
};

function Avatar({ name, url, size = "md" }: { name: string | null; url: string | null; size?: "sm" | "md" }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "member"}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600`}
    >
      {initials}
    </div>
  );
}

export default async function PublishedCollabDetailPage({ params }: CollabDetailPageProps) {
  const { id } = await params;
  const collab = await getPublishedCollabDetail(id);
  if (!collab) notFound();

  const hasMedia = collab.media.length > 0;
  const hasBulletins = collab.bulletins.length > 0;
  const hasTasks = collab.tasks.length > 0;
  const hasContent = hasMedia || hasBulletins || hasTasks;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col bg-background px-6 py-12 text-foreground">
      <Link
        href="/community"
        className="mb-6 self-start text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-700"
      >
        ← Community
      </Link>

      {/* Hero */}
      <h1 className="text-3xl font-semibold tracking-tight">{collab.title}</h1>
      {collab.summary && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{collab.summary}</p>
      )}
      <p className="mt-3 text-xs text-zinc-400">
        Published by{" "}
        {collab.publisherProfileId ? (
          <Link
            href={`/profile/${collab.publisherProfileId}`}
            className="font-medium text-zinc-600 hover:underline"
          >
            {collab.publisherName ?? "someone"}
          </Link>
        ) : (
          <span className="font-medium text-zinc-600">{collab.publisherName ?? "a team"}</span>
        )}{" "}
        · {new Date(collab.publishedAt).toLocaleDateString()}
      </p>

      {/* Members */}
      {collab.members.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Team
          </p>
          <div className="flex flex-wrap gap-3">
            {collab.members.map((m) => (
              <Link
                key={m.id}
                href={`/profile/${m.id}`}
                className="flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Avatar name={m.displayName} url={m.avatarUrl} size="sm" />
                {m.displayName ?? "Member"}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!hasContent && (
        <div className="mt-10 rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-white/70 p-8 text-center text-sm text-zinc-500">
          This team hasn&apos;t marked any content as external yet.
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <section className="mt-10">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Media
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {collab.media.map((m) => (
              <a
                key={m.id}
                href={m.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-white"
              >
                {m.type === "image" || m.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.publicUrl}
                    alt={m.title ?? "media"}
                    className="aspect-square w-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : m.type === "video" || m.mimeType?.startsWith("video/") ? (
                  <video
                    src={m.publicUrl}
                    className="aspect-square w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-zinc-50 text-xs text-zinc-400">
                    {m.mimeType ?? "file"}
                  </div>
                )}
                {m.title && (
                  <p className="px-2 py-1.5 text-[11px] font-medium text-zinc-700 truncate">
                    {m.title}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Bulletins */}
      {hasBulletins && (
        <section className="mt-10">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Notes
          </p>
          <div className="space-y-2">
            {collab.bulletins.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    {b.boardColumn}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{b.title}</p>
                    {b.description && (
                      <p className="mt-0.5 text-xs text-zinc-500">{b.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      {hasTasks && (
        <section className="mt-10">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Tasks
          </p>
          <div className="overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-white">
            {collab.tasks.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-[color:var(--border-subtle)]" : ""}`}
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[t.status] ?? "bg-zinc-100 text-zinc-500"}`}
                >
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
                <p className="min-w-0 flex-1 text-sm text-zinc-800 truncate">{t.title}</p>
                <div className="shrink-0 text-right text-[11px] text-zinc-400 space-y-0.5">
                  {t.assigneeName && <p>{t.assigneeName}</p>}
                  {t.dueDate && (
                    <p>{new Date(t.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-[color:var(--border-subtle)] pt-6 text-center">
        <p className="text-xs text-zinc-400">
          Published on CoLabs ·{" "}
          {new Date(collab.updatedAt).toLocaleDateString()}
        </p>
        <Link
          href="/community"
          className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Browse more collaborations →
        </Link>
      </div>
    </main>
  );
}
