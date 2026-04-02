"use server";

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileByClerkId } from "@/lib/profile";

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutSession(
  billingMode: "monthly" | "annual"
): Promise<CreateCheckoutResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return { ok: false, error: "Stripe is not configured" };

    const priceId =
      billingMode === "annual"
        ? process.env.STRIPE_PRICE_PRO_ANNUAL
        : process.env.STRIPE_PRICE_PRO_MONTHLY;

    if (!priceId) {
      return {
        ok: false,
        error: `Stripe price ID for ${billingMode} plan is not configured. Add STRIPE_PRICE_PRO_${billingMode.toUpperCase()} to your environment variables.`,
      };
    }

    // Check if user already has a Stripe customer ID to avoid duplicates
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);

    const stripe = new Stripe(secretKey);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { clerk_user_id: userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.colabsai.com"}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.colabsai.com"}/pricing?canceled=1`,
      allow_promotion_codes: true,
    };

    // Re-use existing Stripe customer if available
    const existingCustomerId = (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) return { ok: false, error: "Could not create checkout session" };
    return { ok: true, url: session.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function createBillingPortalSession(): Promise<CreateCheckoutResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return { ok: false, error: "Stripe is not configured" };

    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    const customerId = (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;

    if (!customerId) {
      return { ok: false, error: "No billing account found. Please upgrade first." };
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.colabsai.com"}/dashboard`,
    });

    return { ok: true, url: session.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
