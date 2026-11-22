import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Indlogget bruger + Supabase-klient. Sender til login, hvis sessionen mangler. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Brugerens aktive center (eller null). */
export async function getActiveGym() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_gym_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.active_gym_id) return { supabase, user, gym: null };
  const { data: gym } = await supabase
    .from("gyms")
    .select("id, name, city, is_sample, created_by")
    .eq("id", profile.active_gym_id)
    .maybeSingle();
  return { supabase, user, gym };
}

/** Fjerner tegn, der har særlig betydning i PostgREST-filtre og LIKE-mønstre. */
export function sanitizeSearch(q: string) {
  return q.replace(/[%_*,().\\"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function cleanText(v: FormDataEntryValue | null, max = 80) {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
