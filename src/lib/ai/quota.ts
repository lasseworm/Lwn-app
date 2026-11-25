import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * AI-kvoter. Grænserne står i tabellen plan_limits (gratis/pro) og kan ændres
 * i Supabase uden kodeændring. Hvert AI-kald gemmes i ai_usage.
 *
 * Fast mønster i en route:
 *   if (!(await hasQuota(user.id, "coach_chat"))) return { quota: "exceeded" }
 *   ... kald AI ...
 *   await recordUsage({ userId: user.id, feature: "coach_chat", usage })
 */
export type AiFeature =
  | "machine_recognition"
  | "starter_program"
  | "program_generation"
  | "coach_chat"
  | "analysis"
  | "weight_stack"; // logges, men følger machine_recognition (se hasWeightStackQuota)

/** Antal kald tilbage denne periode. null = ubegrænset. */
export async function remaining(userId: string, feature: Exclude<AiFeature, "weight_stack">) {
  const { data, error } = await createAdminClient().rpc("ai_remaining", {
    p_user: userId,
    p_feature: feature,
  });
  if (error) throw error;
  return data;
}

export async function hasQuota(userId: string, feature: Exclude<AiFeature, "weight_stack">) {
  const left = await remaining(userId, feature);
  return left === null || left > 0;
}

/**
 * Aflæsning af vægtstak hører til opsætningen af en maskine.
 * Den er tilladt, så længe brugeren har maskingenkendelser tilbage,
 * med et loft på 2 aflæsninger pr. tilladt genkendelse om måneden.
 */
export async function hasWeightStackQuota(userId: string) {
  const supabase = createAdminClient();
  const pro = await isPro(userId);
  const { data: limit } = await supabase
    .from("plan_limits")
    .select("max_uses")
    .eq("plan", pro ? "pro" : "free")
    .eq("feature", "machine_recognition")
    .maybeSingle();
  if (limit && limit.max_uses === null) return true;
  const cap = 2 * (limit?.max_uses ?? 0);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "weight_stack")
    .gte("created_at", monthStart.toISOString());
  if (error) throw error;
  return (count ?? 0) < cap;
}

export async function recordUsage(params: {
  userId: string;
  feature: AiFeature;
  model?: string | null;
  usage?: { input_tokens: number; output_tokens: number } | null;
  gymId?: string | null;
}) {
  const { error } = await createAdminClient()
    .from("ai_usage")
    .insert({
      user_id: params.userId,
      feature: params.feature,
      model: params.model ?? null,
      input_tokens: params.usage?.input_tokens ?? 0,
      output_tokens: params.usage?.output_tokens ?? 0,
      gym_id: params.gymId ?? null,
    });
  if (error) console.error("Kunne ikke gemme AI-forbrug:", error);
}

export async function isPro(userId: string) {
  const { data, error } = await createAdminClient().rpc("is_pro", { p_user: userId });
  if (error) throw error;
  return Boolean(data);
}
