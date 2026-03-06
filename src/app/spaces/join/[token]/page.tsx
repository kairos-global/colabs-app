import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { acceptSpaceInviteByToken } from "../../actions";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinSpacePage({ params }: JoinPageProps) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/spaces/join/${token}`);
  }

  const result = await acceptSpaceInviteByToken(token);
  if (result.ok) {
    redirect(`/spaces/${result.spaceId}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-sm rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-6 text-center">
        <h1 className="text-base font-semibold tracking-tight">Invite not available</h1>
        <p className="mt-2 text-sm text-zinc-600">
          This invite link is no longer active. It may have been accepted, declined, or expired.
        </p>
      </div>
    </main>
  );
}

