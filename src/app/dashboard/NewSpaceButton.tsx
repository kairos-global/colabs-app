"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSpace } from "@/app/spaces/actions";

export function NewSpaceButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await createSpace();
    setPending(false);
    if (result.ok) {
      router.push(`/spaces/${result.spaceId}`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-50"
    >
      {pending ? "Creating…" : "New space"}
    </button>
  );
}
