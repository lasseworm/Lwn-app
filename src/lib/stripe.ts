import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Lille Stripe-klient direkte mod REST-API'et (ingen ekstra npm-pakke).
 * Vi bruger kun en håndfuld kald: Checkout, kundeportal, kunder og abonnementer.
 */

const API = "https://api.stripe.com/v1";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lwn.dk").replace(/\/$/, "");

/** Antal gratis prøvedage på Pro første gang. 0 = ingen prøveperiode. */
export const PRO_TRIAL_DAYS = 14;

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Mangler STRIPE_SECRET_KEY. Se .env.example.");
  return key;
}

type Params = Record<string, unknown>;

/** Stripe forventer form-encoding med nøgler som line_items[0][price]. */
function encode(params: Params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === "object") encode(item as Params, `${key}[${i}]`, out);
        else out.append(`${key}[${i}]`, String(item));
      });
    } else if (typeof v === "object") {
      encode(v as Params, key, out);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

export class StripeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function stripeRequest<T>(method: "GET" | "POST", path: string, params: Params = {}): Promise<T> {
  const body = encode(params);
  const url = method === "GET" && [...body].length ? `${API}${path}?${body}` : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new StripeError(json.error?.message ?? `Stripe-fejl ${res.status}`, res.status);
  return json;
}

// ---------------------------------------------------------------------------
// De felter vi bruger fra Stripes objekter
// ---------------------------------------------------------------------------

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number; // ældre API-versioner
  metadata?: Record<string, string>;
  items: { data: { current_period_end?: number; price?: { id: string } }[] };
};

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

// ---------------------------------------------------------------------------
// Webhook-signatur (samme metode som Stripes officielle SDK)
// ---------------------------------------------------------------------------

const TOLERANCE_SECONDS = 300;

export function verifyWebhook(payload: string, header: string | null): StripeEvent {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Mangler STRIPE_WEBHOOK_SECRET. Se .env.example.");
  if (!header) throw new Error("Mangler stripe-signature");

  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || signatures.length === 0) throw new Error("Ugyldig stripe-signature");

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) throw new Error("Webhook for gammel");

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest();
  const ok = signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!ok) throw new Error("Signaturen passer ikke");

  return JSON.parse(payload) as StripeEvent;
}
