"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export function HomeAuthHeader() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return null;
  return (
    <header className="flex items-center justify-end border-b border-[color:var(--border-subtle)] px-6 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/sign-in"
          className="rounded-full border border-black bg-background px-3 py-1.5 text-sm font-medium hover:bg-white"
        >
          Log in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
