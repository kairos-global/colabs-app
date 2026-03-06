import { BillingPricingSection } from "./BillingToggle";
import { Suspense } from "react";

export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground md:py-16">
      <div className="w-full max-w-5xl">
        <div className="mb-10 flex items-center gap-2 text-sm font-medium text-zinc-800 md:mb-14">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300">
            <span className="h-3 w-3 rounded-full border border-zinc-800" />
          </div>
          <span>CoLabs</span>
        </div>

        <header className="max-w-xl">
          <h1 className="font-serif text-3xl font-normal tracking-tight md:text-4xl">
            Simple, honest pricing.
          </h1>
          <p className="mt-3 text-sm text-zinc-600 md:text-base">
            Start for free, upgrade when your team is ready to grow.
          </p>
        </header>

        <Suspense>
          <BillingPricingSection />
        </Suspense>

        <p className="mt-8 text-center text-xs text-zinc-500 md:mt-10">
          All plans include verified ownership records. No hidden fees. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

