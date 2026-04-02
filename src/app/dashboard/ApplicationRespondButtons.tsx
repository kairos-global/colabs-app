"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { respondToListingApplication } from "@/app/community/actions";

export function ApplicationRespondButtons({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (status !== "pending") return null;

  async function respond(next: "accepted" | "rejected") {
    setPending(true);
    const result = await respondToListingApplication(applicationId, next);
    setPending(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => respond("accepted")}
        className="rounded border border-black bg-[#00cefc] px-2 py-0.5 text-[10px] font-semibold text-black disabled:opacity-50"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => respond("rejected")}
        className="rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-700 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
