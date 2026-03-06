import Link from "next/link";
import { getUserSpaces, listSpaceInvitesForDashboard } from "@/app/spaces/actions";
import { listApplicationsForDashboard } from "@/app/community/actions";
import { NewSpaceButton } from "./NewSpaceButton";

export default async function DashboardPage() {
  const [spaces, invites, applications] = await Promise.all([
    getUserSpaces(),
    listSpaceInvitesForDashboard(),
    listApplicationsForDashboard(),
  ]);

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
          <h2 className="text-sm font-semibold tracking-tight">Collaboration Spaces</h2>
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

        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Invites</h2>
          <p className="mt-2 text-sm text-zinc-600">
            See collaboration space invites you&apos;ve sent and received.
          </p>
          {invites.sent.length === 0 && invites.received.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-background/60 p-4 text-xs text-zinc-500">
              No invites yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Sent
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {invites.sent.length === 0 ? (
                    <p className="text-zinc-500">No invites sent.</p>
                  ) : (
                    invites.sent.map((invite) => (
                      <Link
                        key={invite.id}
                        href={`/spaces/${invite.spaceId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-background/80 px-3 py-2 hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{invite.spaceTitle}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                            To {invite.inviteeName ?? "someone"} · {invite.status}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {invite.createdAt
                            ? new Date(invite.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Received
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {invites.received.length === 0 ? (
                    <p className="text-zinc-500">No invites received.</p>
                  ) : (
                    invites.received.map((invite) => (
                      <Link
                        key={invite.id}
                        href={`/spaces/join/${invite.token}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-background/80 px-3 py-2 hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{invite.spaceTitle}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                            From {invite.inviterName ?? "someone"} · {invite.status}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {invite.createdAt
                            ? new Date(invite.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Applications</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Track the collaboration listings you&apos;ve applied to and the applications you
            receive as a listing owner.
          </p>
          {applications.sent.length === 0 && applications.received.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-background/60 p-4 text-xs text-zinc-500">
              No applications yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Sent
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {applications.sent.length === 0 ? (
                    <p className="text-zinc-500">No applications sent.</p>
                  ) : (
                    applications.sent.map((app) => (
                      <Link
                        key={app.id}
                        href={`/community/listings/${app.listingId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-background/80 px-3 py-2 hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{app.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                            Status: {app.status}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Received
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {applications.received.length === 0 ? (
                    <p className="text-zinc-500">No applications received.</p>
                  ) : (
                    applications.received.map((app) => (
                      <Link
                        key={app.id}
                        href={`/community/listings/${app.listingId}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-background/80 px-3 py-2 hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{app.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                            From {app.applicantName} · {app.status}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

