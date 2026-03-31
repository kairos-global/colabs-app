import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicationPageDataById } from "@/app/spaces/actions";

type PublishedPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublishedPage({ params }: PublishedPageProps) {
  const { id } = await params;
  const data = await getPublicationPageDataById(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Published</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.title}</h1>
        {data.summary && <p className="mt-3 text-zinc-600">{data.summary}</p>}
        <p className="mt-2 text-sm text-zinc-500">
          {data.space_title ?? "Collaboration"} ·{" "}
          {new Date(data.published_at).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </p>

        {data.cover_public_url && (
          <div className="mt-8 overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.cover_public_url} alt="" className="max-h-[420px] w-full object-cover" />
          </div>
        )}

        {data.media.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-tight">Media</h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {data.media.map((m) => (
                <li
                  key={m.id}
                  className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-white/80"
                >
                  {m.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.publicUrl} alt={m.title ?? ""} className="h-48 w-full object-cover" />
                  ) : m.type === "video" ? (
                    <video src={m.publicUrl} controls className="h-48 w-full bg-black object-contain" />
                  ) : (
                    <div className="p-4">
                      <audio src={m.publicUrl} controls className="w-full" />
                    </div>
                  )}
                  {m.title && <p className="p-2 text-xs font-medium">{m.title}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.bulletins.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-tight">Bulletins</h2>
            <ul className="mt-3 space-y-3">
              {data.bulletins.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-white/80 p-4"
                >
                  <p className="font-medium">{b.title}</p>
                  {b.description && <p className="mt-1 text-sm text-zinc-600">{b.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.tasks.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-tight">Tasks</h2>
            <ul className="mt-3 space-y-2">
              {data.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-white/80 px-3 py-2 text-sm"
                >
                  <span>{t.title}</span>
                  <span className="text-xs uppercase text-zinc-500">{t.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 text-center text-xs text-zinc-500">
          <Link href="/" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
            CoLabs
          </Link>
        </p>
      </div>
    </main>
  );
}
