import { BillingPricingSection } from "./BillingToggle";
import { Suspense } from "react";

export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-14 text-foreground md:py-16">
      <div className="w-full">
        <div className="mx-auto mb-14 flex w-full max-w-[780px] items-center justify-center gap-2 text-sm font-medium tracking-[-0.01em] text-zinc-800 md:mb-16">
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>CoLabs</span>
        </div>

        <header className="mx-auto mb-10 max-w-[780px] text-center md:mb-14">
          <h1 className="font-serif text-4xl font-normal leading-[1.1] tracking-[-0.02em] md:text-[52px]">
            Simple, honest pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-[380px] text-base font-light leading-relaxed text-zinc-500">
            Start for free, upgrade when your team is ready to grow.
          </p>
        </header>

        <Suspense>
          <BillingPricingSection />
        </Suspense>

        <p className="mx-auto mt-8 max-w-[780px] text-center text-xs text-zinc-500 md:mt-10">
          All plans include verified ownership records. No hidden fees. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

