import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeRequest, verifyWebhook, type StripeEvent, type StripeSubscription } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook – Stripe kalder denne ved ændringer i abonnementer.
 * Holder tabellen subscriptions opdateret. Kræver ikke login (se lib/supabase/proxy.ts),
 * men signaturen tjekkes med STRIPE_WEBHOOK_SECRET.
 *
 * Hændelser der skal vælges i Stripe:
 *   checkout.session.completed, customer.subscription.created|updated|deleted,
 *   invoice.paid, invoice.payment_failed
 */
const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

const STATUSES = new Set(["trialing", "active", "past_due", "canceled", "incomplete", "unpaid"]);

export async function POST(request: NextRequest) {
  const payload = await request.text(); // rå tekst – kræves til signaturtjek

  let event: StripeEvent;
  try {
    event = verifyWebhook(payload, request.headers.get("stripe-signature"));
  } catch (e) {
    console.error("Afvist Stripe-webhook:", e);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const { data: seen } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    const obj = event.data.object;
    let subscriptionId: string | null = null;
    let userIdHint: string | null = null;

    if (event.type === "checkout.session.completed") {
      if (obj.mode === "subscription") {
        subscriptionId = idOf(obj.subscription);
        userIdHint = (obj.client_reference_id as string | null) ?? null;
      }
    } else if (event.type.startsWith("invoice.")) {
      const parent = obj.parent as { subscription_details?: { subscription?: unknown } } | null | undefined;
      subscriptionId = idOf(parent?.subscription_details?.subscription) ?? idOf(obj.subscription);
    } else {
      subscriptionId = obj.id as string;
    }

    if (subscriptionId) {
      // Hent altid den friske version, så rækkefølgen af hændelser ikke betyder noget
      const sub = await stripeRequest<StripeSubscription>("GET", `/subscriptions/${subscriptionId}`);
      await syncSubscription(sub, userIdHint ?? sub.metadata?.user_id ?? null);
    }

    await admin.from("stripe_events").insert({ id: event.id, type: event.type });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Fejl i Stripe-webhook:", e);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 }); // Stripe prøver igen
  }
}

function idOf(ref: unknown): string | null {
  if (typeof ref === "string") return ref;
  if (ref && typeof ref === "object" && "id" in ref && typeof ref.id === "string") return ref.id;
  return null;
}

async function syncSubscription(sub: StripeSubscription, userIdHint: string | null) {
  const admin = createAdminClient();

  let userId = userIdHint;
  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", sub.customer)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) throw new Error(`Ingen bruger fundet for Stripe-kunde ${sub.customer}`);

  const item = sub.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? sub.current_period_end ?? null;
  const status =
    sub.status === "incomplete_expired" ? "canceled" : STATUSES.has(sub.status) ? sub.status : "inactive";

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status,
      price_id: item?.price?.id ?? null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
