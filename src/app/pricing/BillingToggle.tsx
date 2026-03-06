"use client";

import { useState } from "react";

export type BillingMode = "annual" | "monthly";

type BillingToggleProps = {
  mode: BillingMode;
  onChange: (mode: BillingMode) => void;
};

export function BillingToggle({ mode, onChange }: BillingToggleProps) {
  function handleClick() {
    const next = mode === "annual" ? "monthly" : "annual";
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

export function BillingPricingSection() {
  const [mode, setMode] = useState<BillingMode>("annual");

  const annual = mode === "annual";
  const proPrice = annual ? 8 : 10;
  const proSub = annual ? "Billed $96/year per seat" : "Billed monthly per seat";

  return (
    <>
      <BillingToggle mode={mode} onChange={setMode} />
      <div className="mt-6 grid max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 md:mt-8 md:grid-cols-2">
        {/* Starter */}
        <section className="border-r border-zinc-200 bg-background px-7 py-10 text-sm text-zinc-900 md:px-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Starter
          </p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-lg text-zinc-400">$</span>
            <span className="font-serif text-4xl tracking-tight md:text-5xl">0</span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">Free forever. No credit card.</p>

          <div className="mt-6 h-px bg-zinc-200" />

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            What&apos;s included
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <strong>Up to 3 Spaces</strong>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Organize by project or team
              </span>
            </li>
            <li>
              <strong>10 collaborators</strong> per Space
            </li>
            <li>Chat, bulletins &amp; task tracking</li>
            <li>
              Media sharing
              <span className="mt-0.5 block text-xs text-zinc-500">
                2 GB storage per Space
              </span>
            </li>
            <li>Publish work with verified credits</li>
            <li>Public profile &amp; portfolio page</li>
          </ul>

          <button
            type="button"
            className="mt-7 w-full rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-50 transition hover:bg-transparent hover:text-zinc-900"
          >
            Get started free
          </button>
        </section>

        {/* Pro */}
        <section className="bg-zinc-900 px-7 py-10 text-sm text-zinc-50 md:px-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Pro
          </p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-lg text-zinc-500">$</span>
            <span className="font-serif text-4xl tracking-tight md:text-5xl">
              {proPrice}
            </span>
            <span className="ml-1 text-xs font-light text-zinc-300">/ mo per seat</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">{proSub}</p>

          <div className="mt-6 h-px bg-zinc-800" />

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Everything in Starter, plus
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <strong>Unlimited Spaces</strong>
            </li>
            <li>
              <strong>Unlimited collaborators</strong>
              <span className="mt-0.5 block text-xs text-zinc-400">
                Only paying seats can create Spaces
              </span>
            </li>
            <li>
              <strong>50 GB</strong> storage per Space
            </li>
            <li>Advanced task tools</li>
            <li>
              Published work analytics
              <span className="mt-0.5 block text-xs text-zinc-400">
                Views, reach, credit engagement
              </span>
            </li>
            <li>Custom Space domain &amp; branding</li>
            <li>Priority support</li>
          </ul>

          <button
            type="button"
            className="mt-7 w-full rounded-lg border border-zinc-50 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-transparent hover:text-zinc-50"
          >
            Start free trial
          </button>
        </section>
      </div>
    </>
  );
}

