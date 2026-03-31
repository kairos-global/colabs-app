"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptSpaceInviteByToken } from "@/app/spaces/actions";

const AGREEMENT_VERSION = "1.0";

export function JoinSpaceClient({ token }: { token: string }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!agreed || pending) return;
    setError(null);
    setPending(true);
    const result = await acceptSpaceInviteByToken(token, {
      agreementAccepted: true,
      agreementVersion: AGREEMENT_VERSION,
    });
    setPending(false);
    if (result.ok) {
      router.push(`/spaces/${result.spaceId}`);
      router.refresh();
      return;
    }
    setError(result.error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-6 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">Join collaboration space</h1>
        <p className="mt-2 text-sm text-zinc-600">
          You&apos;ve been invited to collaborate on CoLabs. By joining, you confirm you understand
          that ownership and compensation are determined between collaborators, not enforced by
          CoLabs, and you agree to the collaboration terms for this project.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-zinc-300"
          />
          <span>I agree to the collaboration terms and understand CoLabs does not enforce payment or ownership splits.</span>
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={!agreed || pending}
          onClick={handleJoin}
          className="mt-6 w-full rounded-full border border-black bg-[#00cefc] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00b3dd] disabled:opacity-50"
        >
          {pending ? "Joining…" : "Accept and join space"}
        </button>
      </div>
    </main>
  );
}
