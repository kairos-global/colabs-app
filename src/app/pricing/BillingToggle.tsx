"use client";

import Link from "next/link";
import { useState } from "react";

export type BillingMode = "annual" | "monthly";

type BillingToggleProps = {
  mode: BillingMode;
  onChange: (mode: BillingMode) => void;
};

function CheckIcon({ tone }: { tone: "dark" | "light" }) {
  const stroke = tone === "light" ? "stroke-white/15" : "stroke-black/15";
  const check = tone === "light" ? "stroke-white" : "stroke-black";
  return (
    <svg
      className="mt-0.5 h-[18px] w-[18px] shrink-0"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="8.5" className={stroke} />
      <path
        d="M5.5 9l2.5 2.5 4.5-5"
        className={check}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BillingToggle({ mode, onChange }: BillingToggleProps) {
  function handleClick() {
    const next = mode === "annual" ? "monthly" : "annual";
    onChange(next);
  }

  return (
    <div className="mx-auto mt-10 flex items-center justify-center gap-3 text-xs font-light text-zinc-500 md:mt-12">
      <span>Monthly</span>
      <button
        type="button"
        onClick={handleClick}
        className="relative inline-flex h-[22px] w-10 items-center rounded-full bg-black transition"
        aria-label="Toggle billing period"
      >
        <span
          className={[
            "absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-transform",
            mode === "annual" ? "translate-x-[18px]" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      <span>Annual</span>
      <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
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
      <div className="mx-auto mt-12 grid w-full max-w-[780px] grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-200 md:grid-cols-2">
        {/* Starter */}
        <section className="bg-background px-7 py-10 text-sm text-zinc-900 md:px-10 md:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/50">
            Starter
          </p>
          <div className="mt-7 flex items-baseline gap-1">
            <span className="text-xl font-light text-black/50">$</span>
            <span className="text-5xl font-normal leading-none tracking-[-0.03em]">
              0
            </span>
          </div>
          <p className="mt-2 text-[13px] font-light text-zinc-500">
            Free forever. No credit card.
          </p>

          <div className="mt-8 h-px bg-zinc-200" />

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.1em] text-black/35">
            What&apos;s included
          </p>
          <ul className="mt-5 flex flex-col gap-3.5 text-sm">
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">
                Up to <strong>3 Spaces</strong>
                <span className="mt-0.5 block text-xs text-black/45">
                  Organize by project or team
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">
                <strong>10 collaborators</strong> per Space
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">Chat, bulletins &amp; task tracking</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">
                Media sharing
                <span className="mt-0.5 block text-xs text-black/45">
                  2 GB storage per Space
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">
                Publish work with <strong>verified credits</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="dark" />
              <span className="leading-snug">Public profile &amp; portfolio page</span>
            </li>
          </ul>

          <Link
            href="/sign-up"
            data-plan="starter"
            className="mt-10 block w-full rounded-[10px] border border-black bg-black px-6 py-3.5 text-center text-sm font-medium text-white transition hover:bg-transparent hover:text-black"
          >
            Get started free
          </Link>
        </section>

        {/* Pro */}
        <section className="bg-black px-7 py-10 text-sm text-white md:px-10 md:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Pro
          </p>
          <div className="mt-7 flex items-baseline gap-1">
            <span className="text-xl font-light text-white/40">$</span>
            <span className="text-5xl font-normal leading-none tracking-[-0.03em]">
              {proPrice}
            </span>
            <span className="ml-1 text-xs font-light text-white/40">/ mo per seat</span>
          </div>
          <p className="mt-2 text-[13px] font-light text-white/40">{proSub}</p>

          <div className="mt-8 h-px bg-white/10" />

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">
            Everything in Starter, plus
          </p>
          <ul className="mt-5 flex flex-col gap-3.5 text-sm">
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">
                <strong>Unlimited Spaces</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">
                <strong>Unlimited collaborators</strong>
                <span className="mt-0.5 block text-xs text-white/35">
                  Only paying seats can create Spaces
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">
                <strong>50 GB</strong> storage per Space
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">Advanced task tools</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">
                Published work analytics
                <span className="mt-0.5 block text-xs text-white/35">
                  Views, reach, credit engagement
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">Custom Space domain &amp; branding</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon tone="light" />
              <span className="leading-snug">Priority support</span>
            </li>
          </ul>

          <Link
            href={{
              pathname: "/sign-up",
              query: { plan: "pro", billing: mode },
            }}
            data-plan="pro"
            data-billing={mode}
            className="mt-10 block w-full rounded-[10px] border border-white bg-white px-6 py-3.5 text-center text-sm font-medium text-black transition hover:bg-transparent hover:text-white"
          >
            Start free trial
          </Link>
        </section>
      </div>
    </>
  );
}

