"use client";

import { useState, useTransition } from "react";
import { createSpaceInvite } from "@/app/spaces/actions";

type InviteCollaboratorsModalProps = {
  spaceId: string;
  onClose: () => void;
};

export function InviteCollaboratorsModal({ spaceId, onClose }: InviteCollaboratorsModalProps) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter an email to invite.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createSpaceInvite({
        spaceId,
        inviteeEmail: email.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLink(result.joinUrl);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">Invite collaborators</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Send an invite link to bring collaborators into this space. Start with email-based invites;
          we&apos;ll expand search-by-user next.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
              Invite by email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
              placeholder="name@example.com"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-50"
          >
            {pending ? "Sending invite…" : "Send invite"}
          </button>
        </form>

        {link && (
          <div className="mt-4 rounded-lg border border-dashed border-[color:var(--border-subtle)] bg-white/80 px-3 py-2 text-xs text-zinc-700">
            <p className="font-medium">Invite link</p>
            <p className="mt-1 break-all text-[11px] text-zinc-600">
              {typeof window !== "undefined" ? `${window.location.origin}${link}` : link}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Anyone with this link can sign in or create an account and will be added to this
              collaboration space.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[color:var(--border-subtle)] px-4 py-1.5 text-sm font-medium hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
