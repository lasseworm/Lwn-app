import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Card } from "@/components/ui";
import { requireUser } from "@/lib/gyms";
import { PHOTO_BUCKET } from "@/lib/ai/photo";
import { loadCatalog, loadGymEquipment, loadPreferences } from "@/lib/training/data";
import { loadTypeFor } from "@/lib/training/generator";
import type { ProgressState } from "@/lib/training/progression";
import { t } from "@/i18n";
import { WorkoutSession, type SessionItem, type AltOption, type LoggedSet } from "./workout-session";

export const metadata: Metadata = { title: "Træning" };

const fmtKg = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 2 });

export default async function WorkoutPage(props: PageProps<"/traening/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, user } = await requireUser();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, gym_id, program_day_id, finished_at, program_days(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!workout) notFound();

  if (workout.finished_at) return <Summary workoutId={workout.id} title={workout.program_days?.name ?? ""} />;

  const [catalog, equipment, preferences, { data: planRows }, { data: progressRows }, { data: logged }, { data: profile }] =
    await Promise.all([
      loadCatalog(supabase),
      workout.gym_id ? loadGymEquipment(supabase, workout.gym_id) : Promise.resolve([]),
      loadPreferences(supabase, user.id),
      supabase
        .from("program_exercises")
        .select("id, position, sets, rep_min, rep_max, exercise_id, equipment_id")
        .eq("program_day_id", workout.program_day_id ?? "")
        .order("position"),
      supabase.from("exercise_progress").select("*").eq("user_id", user.id),
      supabase
        .from("workout_sets")
        .select("id, exercise_id, equipment_id, set_index, weight_kg, reps, completed, is_warmup, pain_reported")
        .eq("workout_id", workout.id)
        .order("created_at"),
      supabase.from("profiles").select("warmup_enabled").eq("id", user.id).maybeSingle(),
    ]);

  const catalogById = new Map(catalog.map((e) => [e.id, e]));
  const STATUS_RANK: Record<string, number> = { verified: 0, pending: 1, disputed: 2 };
  const eqByType = new Map<string, (typeof equipment)[number]>();
  for (const e of [...equipment].sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)))
    if (!eqByType.has(e.machine_type_slug)) eqByType.set(e.machine_type_slug, e);
  const eqById = new Map(equipment.map((e) => [e.id, e]));
  const progressMap = new Map((progressRows ?? []).map((p) => [`${p.exercise_id}|${p.equipment_id}`, p]));

  // Centrets egne fotos af maskinerne (signerede links, 1 time)
  const photoPaths = [...new Set(equipment.map((e) => e.photo_path).filter((p): p is string => !!p))];
  const photoUrls = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photoPaths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) photoUrls.set(s.path, s.signedUrl);
  }

  const toOption = (exerciseId: string, equipmentId?: string | null): AltOption | null => {
    const ex = catalogById.get(exerciseId);
    if (!ex) return null;
    const eq = (equipmentId && eqById.get(equipmentId)) || eqByType.get(ex.machine_type_slug);
    if (!eq || eq.machine_type_slug !== ex.machine_type_slug) return null;
    return {
      exerciseId: ex.id,
      slug: ex.slug,
      name: ex.name,
      machineTypeSlug: ex.machine_type_slug,
      movementPattern: ex.movement_pattern,
      primaryMuscles: ex.primary_muscles,
      isFreeWeight: ex.is_free_weight,
      beginnerFriendly: ex.beginner_friendly !== false,
      repMin: ex.default_rep_min,
      repMax: ex.default_rep_max,
      equipmentId: eq.id,
      settings: {
        weight_step_kg: eq.weight_step_kg,
        extra_plate_kg: eq.extra_plate_kg,
        min_weight_kg: eq.min_weight_kg,
        max_weight_kg: eq.max_weight_kg,
      },
      load: loadTypeFor(ex.machine_type_slug, ex.machine_category, eq.weight_step_kg != null),
      state: (progressMap.get(`${ex.id}|${eq.id}`) as ProgressState | undefined) ?? null,
      photoUrl: (eq.photo_path && photoUrls.get(eq.photo_path)) || null,
    };
  };

  const items: SessionItem[] = [];
  for (const pe of planRows ?? []) {
    if (!pe.exercise_id) continue;
    // Husket alternativ eller udeladelse gælder også for programmer lavet før valget
    const pref = preferences[pe.exercise_id];
    let option = toOption(pe.exercise_id, pe.equipment_id);
    let skipped = false;
    if (pref?.excluded) skipped = true;
    else if (pref?.replacement_exercise_id) option = toOption(pref.replacement_exercise_id) ?? option;
    if (!option) continue;
    items.push({
      key: pe.id,
      originalExerciseId: pe.exercise_id,
      plan: {
        sets: pe.sets ?? 3,
        repMin: option.exerciseId === pe.exercise_id ? (pe.rep_min ?? option.repMin) : option.repMin,
        repMax: option.exerciseId === pe.exercise_id ? (pe.rep_max ?? option.repMax) : option.repMax,
      },
      option,
      initiallySkipped: skipped,
    });
  }

  // Alternativ-pulje: alt i kataloget, som centret har udstyr til, og som ikke er udeladt
  const pool = catalog
    .filter((e) => !preferences[e.id]?.excluded)
    .map((e) => toOption(e.id))
    .filter((o): o is AltOption => o != null);

  const loggedSets: LoggedSet[] = (logged ?? []).map((s) => ({
    id: s.id,
    exerciseId: s.exercise_id ?? "",
    equipmentId: s.equipment_id ?? "",
    setIndex: s.set_index ?? 0,
    weight: s.weight_kg,
    reps: s.reps ?? 0,
    completed: !!s.completed,
    isWarmup: !!s.is_warmup,
    pain: !!s.pain_reported,
  }));

  return (
    <WorkoutSession
      workoutId={workout.id}
      title={workout.program_days?.name ?? ""}
      items={items}
      pool={pool}
      logged={loggedSets}
      warmupEnabled={!!profile?.warmup_enabled}
      nowIso={new Date().toISOString()}
    />
  );
}

async function Summary({ workoutId, title }: { workoutId: string; title: string }) {
  const { supabase, user } = await requireUser();
  const { data: sets } = await supabase
    .from("workout_sets")
    .select("exercise_id, equipment_id, completed, is_warmup, pain_reported, exercises(name)")
    .eq("workout_id", workoutId);
  const work = (sets ?? []).filter((s) => !s.is_warmup);
  const done = work.filter((s) => s.completed);

  const groups = new Map<string, { name: string; done: number; pain: boolean; exerciseId: string; equipmentId: string }>();
  for (const s of work) {
    const k = `${s.exercise_id}|${s.equipment_id}`;
    const g = groups.get(k) ?? { name: s.exercises?.name ?? "", done: 0, pain: false, exerciseId: s.exercise_id ?? "", equipmentId: s.equipment_id ?? "" };
    if (s.completed) g.done++;
    if (s.pain_reported) g.pain = true;
    groups.set(k, g);
  }
  const { data: progress } = await supabase
    .from("exercise_progress")
    .select("exercise_id, equipment_id, current_weight_kg, current_reps, hold_level, last_successful_weight_kg, last_successful_reps")
    .eq("user_id", user.id);
  const pMap = new Map((progress ?? []).map((p) => [`${p.exercise_id}|${p.equipment_id}`, p]));

  return (
    <main className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">{title}</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight">
          {t.workout.summaryTitle}
        </h1>
        <p className="mt-2 text-base text-muted">{t.workout.summaryIntro(done.length)}</p>
      </header>
      <Card className="p-0">
        <ul className="divide-y divide-border">
          {[...groups.values()].map((g) => {
            const p = pMap.get(`${g.exerciseId}|${g.equipmentId}`);
            const w = p?.hold_level ? p.last_successful_weight_kg : p?.current_weight_kg;
            const r = p?.hold_level ? p.last_successful_reps : p?.current_reps;
            return (
              <li key={`${g.exerciseId}|${g.equipmentId}`} className="px-5 py-3">
                <span className="block text-base font-semibold">{g.name}</span>
                <span className="block text-sm text-muted">
                  {g.pain
                    ? t.workout.stopped
                    : `${g.done} sæt · ${t.workout.nextTime}: ${w != null ? `${fmtKg(w)} kg × ` : ""}${r ?? "–"}${p?.hold_level ? ` (${t.workout.sameLevel.toLowerCase()})` : ""}`}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <ButtonLink href="/hjem">{t.workout.backHome}</ButtonLink>
    </main>
  );
}
