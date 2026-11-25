"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRO_TRIAL_DAYS, siteUrl, stripeRequest } from "@/lib/stripe";

const ACTIVE = ["active", "trialing"];

/** Starter Stripe Checkout for LWN Pro og sender brugeren dertil. */
export async function startCheckout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro");

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error("Mangler STRIPE_PRO_PRICE_ID. Se .env.example.");

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub && ACTIVE.includes(sub.status)) redirect("/pro");

  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripeRequest<{ id: string }>("POST", "/customers", {
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    const { error } = await admin
      .from("subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    if (error) throw error;
  }

  // Prøveperiode kun første gang (status "inactive" = aldrig haft abonnement)
  const firstTime = !sub || sub.status === "inactive";

  const session = await stripeRequest<{ url: string }>("POST", "/checkout/sessions", {
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id },
    subscription_data: {
      metadata: { user_id: user.id },
      ...(firstTime && PRO_TRIAL_DAYS > 0 ? { trial_period_days: PRO_TRIAL_DAYS } : {}),
    },
    allow_promotion_codes: true,
    locale: "da",
    success_url: `${siteUrl()}/pro?status=velkommen`,
    cancel_url: `${siteUrl()}/pro`,
  });

  redirect(session.url);
}

/** Åbner Stripes kundeportal (opsig, skift kort, kvitteringer). */
export async function openPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro");

  const { data: sub } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) redirect("/pro");

  const portal = await stripeRequest<{ url: string }>("POST", "/billing_portal/sessions", {
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl()}/pro`,
    locale: "da",
  });

  redirect(portal.url);
}
