"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/gyms";
import { loadCatalog, loadGymEquipment } from "@/lib/training/data";
import { loadTypeFor } from "@/lib/training/generator";
import { evaluate, prescribe, type PerformedSet, type ProgressState } from "@/lib/training/progression";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v * 100) / 100 : null);

/** Kun egne, ikke-afsluttede pas må ændres */
async function ownOpenWorkout(workoutId: string) {
  const { supabase, user } = await requireUser();
  if (!isUuid(workoutId)) return null;
  const { data } = await supabase
    .from("workouts")
    .select("id, gym_id, program_day_id, finished_at")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || data.finished_at) return null;
  return { supabase, user, workout: data };
}

export type SetInput = {
  exerciseId: string;
  equipmentId: string;
  setIndex: number;
  weight: number | null;
  reps: number;
  isWarmup: boolean;
  pain?: boolean;
};

/** Gemmer et sæt med det samme, så intet går tabt, hvis telefonen lukkes */
export async function logSet(workoutId: string, s: SetInput): Promise<{ id: string } | { error: string }> {
  const ctx = await ownOpenWorkout(workoutId);
  if (!ctx || !isUuid(s.exerciseId) || !isUuid(s.equipmentId)) return { error: "invalid" };
  const { data, error } = await ctx.supabase
    .from("workout_sets")
    .insert({
      workout_id: workoutId,
      exercise_id: s.exerciseId,
      equipment_id: s.equipmentId,
      set_index: Math.max(0, Math.min(50, Math.round(s.setIndex))),
      weight_kg: num(s.weight, 1000),
      reps: Math.max(0, Math.min(200, Math.round(s.reps))),
      is_warmup: !!s.isWarmup,
      completed: !s.pain,
      pain_reported: !!s.pain,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };
  return { id: data.id };
}

export async function updateSet(workoutId: string, setId: string, weight: number | null, reps: number) {
  const ctx = await ownOpenWorkout(workoutId);
  if (!ctx || !isUuid(setId)) return { error: "invalid" };
  const { error } = await ctx.supabase
    .from("workout_sets")
    .update({ weight_kg: num(weight, 1000), reps: Math.max(0, Math.min(200, Math.round(reps))) })
    .eq("id", setId)
    .eq("workout_id", workoutId);
  return error ? { error: error.message } : { ok: true };
}

export async function deleteSet(workoutId: string, setId: string) {
  const ctx = await ownOpenWorkout(workoutId);
  if (!ctx || !isUuid(setId)) return { error: "invalid" };
  const { error } = await ctx.supabase.from("workout_sets").delete().eq("id", setId).eq("workout_id", workoutId);
  return error ? { error: error.message } : { ok: true };
}

const REASONS = ["occupied", "dislike", "cannot", "limitation"] as const;

/** Husk et alternativ eller en udeladelse til fremtidige pas (kan altid ændres) */
export async function savePreference(input: {
  originalExerciseId: string;
  replacementExerciseId: string | null;
  excluded: boolean;
  reason: string;
}) {
  const { supabase, user } = await requireUser();
  if (!isUuid(input.originalExerciseId)) return { error: "invalid" };
  if (input.replacementExerciseId && !isUuid(input.replacementExerciseId)) return { error: "invalid" };
  const reason = REASONS.includes(input.reason as (typeof REASONS)[number]) ? input.reason : null;
  const { error } = await supabase.from("exercise_preferences").upsert(
    {
      user_id: user.id,
      original_exercise_id: input.originalExerciseId,
      replacement_exercise_id: input.excluded ? null : input.replacementExerciseId,
      excluded: input.excluded,
      reason,
    },
    { onConflict: "user_id,original_exercise_id" },
  );
  return error ? { error: error.message } : { ok: true };
}

export type FinishItem = {
  programExerciseId: string | null;
  exerciseId: string;
  equipmentId: string;
  /** Den vægt brugeren valgte som mål (startvægt eller lettere start efter pause) */
  targetWeight: number | null;
  progressionDidNotWork: boolean;
};

/**
 * Afslut passet. Progressionen beregnes her på serveren ud fra de gemte sæt –
 * ikke ud fra hvad browseren påstår – og gemmes atomisk med finish_workout().
 */
export async function finishWorkout(workoutId: string, items: FinishItem[]): Promise<{ ok: true } | { error: string }> {
  const ctx = await ownOpenWorkout(workoutId);
  if (!ctx) return { ok: true }; // allerede afsluttet eller ikke ens eget: intet at gøre
  const { supabase, user, workout } = ctx;
  const now = new Date();

  const [catalog, equipment, { data: planRows }, { data: sets }, { data: progressRows }] = await Promise.all([
    loadCatalog(supabase),
    workout.gym_id ? loadGymEquipment(supabase, workout.gym_id) : Promise.resolve([]),
    workout.program_day_id
      ? supabase.from("program_exercises").select("id, exercise_id, sets, rep_min, rep_max").eq("program_day_id", workout.program_day_id)
      : Promise.resolve({ data: [] as { id: string; exercise_id: string | null; sets: number | null; rep_min: number | null; rep_max: number | null }[] }),
    supabase.from("workout_sets").select("exercise_id, equipment_id, weight_kg, reps, completed, is_warmup, pain_reported").eq("workout_id", workoutId),
    supabase.from("exercise_progress").select("*").eq("user_id", user.id),
  ]);

  const catalogById = new Map(catalog.map((e) => [e.id, e]));
  const equipmentById = new Map(equipment.map((e) => [e.id, e]));
  const planById = new Map((planRows ?? []).map((p) => [p.id, p]));
  const progressKey = (e: string, q: string) => `${e}|${q}`;
  const progressMap = new Map((progressRows ?? []).map((p) => [progressKey(p.exercise_id, p.equipment_id), p]));

  // Én post pr. øvelse+udstyr; klientens liste bestemmer kun hvilke + valgt målvægt og flag
  const seen = new Set<string>();
  const progress: Record<string, unknown>[] = [];

  for (const item of Array.isArray(items) ? items.slice(0, 30) : []) {
    if (!isUuid(item.exerciseId) || !isUuid(item.equipmentId)) continue;
    const key = progressKey(item.exerciseId, item.equipmentId);
    if (seen.has(key)) continue;
    seen.add(key);

    const ex = catalogById.get(item.exerciseId);
    const eq = equipmentById.get(item.equipmentId);
    if (!ex || !eq || eq.machine_type_slug !== ex.machine_type_slug) continue;

    const pe = item.programExerciseId ? planById.get(item.programExerciseId) : undefined;
    const plan =
      pe && pe.exercise_id === ex.id
        ? { sets: pe.sets ?? ex.default_sets, repMin: pe.rep_min ?? ex.default_rep_min, repMax: pe.rep_max ?? ex.default_rep_max }
        : { sets: pe?.sets ?? ex.default_sets, repMin: ex.default_rep_min, repMax: ex.default_rep_max };

    const load = loadTypeFor(ex.machine_type_slug, ex.machine_category, eq.weight_step_kg != null);
    const state = (progressMap.get(key) as ProgressState | undefined) ?? null;
    const p = prescribe(state, plan, load, eq, now);

    // Accepter kun en anden målvægt, hvor brugeren selv skal vælge: startvægt eller pauseforslaget
    const target = typeof item.targetWeight === "number" && item.targetWeight > 0 ? Math.round(item.targetWeight * 100) / 100 : null;
    if (p.needsStartWeight) p.weight = target;
    else if (p.pause?.suggestedWeight != null && target === p.pause.suggestedWeight) p.weight = target;

    const mine = (sets ?? []).filter((s) => s.exercise_id === ex.id && s.equipment_id === eq.id && !s.is_warmup);
    const performed: PerformedSet[] = mine
      .filter((s) => !s.pain_reported)
      .map((s) => ({ weight: s.weight_kg, reps: s.reps ?? 0, completed: !!s.completed }));
    const pain = mine.some((s) => s.pain_reported);

    const next = evaluate(state, p, plan, load, eq, performed, { pain, progressionDidNotWork: !!item.progressionDidNotWork });
    if (next) progress.push({ exercise_id: ex.id, equipment_id: eq.id, ...next });
  }

  const { error } = await supabase.rpc("finish_workout", { p_workout_id: workoutId, p_progress: progress as never });
  if (error) {
    console.error("finish_workout:", error.message);
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
