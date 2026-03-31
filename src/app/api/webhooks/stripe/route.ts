import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !secretKey || !sig) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 501 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServerSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerk_user_id;
        const customerRaw = session.customer;
        const customerId =
          typeof customerRaw === "string" ? customerRaw : customerRaw?.id ?? null;
        if (clerkUserId) {
          const updates: { plan_tier: string; stripe_customer_id?: string | null } = {
            plan_tier: "pro",
          };
          if (customerId) updates.stripe_customer_id = customerId;
          await supabase.from("profiles").update(updates).eq("clerk_user_id", clerkUserId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerRaw = sub.customer;
        const customerId =
          typeof customerRaw === "string" ? customerRaw : customerRaw?.id ?? null;
        if (customerId) {
          await supabase
            .from("profiles")
            .update({ plan_tier: "starter" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
