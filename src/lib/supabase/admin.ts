import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Supabase-klient med den HEMMELIGE nøgle (omgår RLS).
 * Kun til serverkode, der skal skrive i tabeller brugerne ikke selv må ændre:
 * subscriptions (Stripe-webhook), stripe_events og ai_usage.
 * Må aldrig importeres i en Client Component.
 */
let admin: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (admin) return admin;
  const { url } = supabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Mangler SUPABASE_SECRET_KEY. Se .env.example.");
  admin = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
