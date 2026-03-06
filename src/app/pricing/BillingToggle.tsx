"use client";

import { useState } from "react";

export type BillingMode = "annual" | "monthly";

type BillingToggleProps = {
  onChange: (mode: BillingMode) => void;
};

export function BillingToggle({ onChange }: BillingToggleProps) {
  const [mode, setMode] = useState<BillingMode>("annual");

  function handleClick() {
    const next = mode === "annual" ? "monthly" : "annual";
    setMode(next);
    onChange(next);
  }

  return (
    <div className="mt-6 flex items-center gap-3 text-xs text-zinc-600 md:mt-8">
      <span>Monthly</span>
      <button
        type="button"
        onClick={handleClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border border-zinc-900 bg-zinc-900 transition-colors ${
          mode === "annual" ? "" : "bg-zinc-700"
        }`}
        aria-label="Toggle billing period"
      >
        <span
          className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform ${
            mode === "annual" ? "translate-x-1" : "translate-x-5"
          }`}
        />
      </button>
      <span>Annual</span>
      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-50">
        2 months free
      </span>
    </div>
  );
}

