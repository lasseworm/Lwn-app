import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { loadTypeFor, type CatalogExercise, type GymEquipmentItem, type Preference } from "./generator";

type Db = SupabaseClient<Database>;

/** Øvelseskatalog i den form, generatoren bruger */
export async function loadCatalog(supabase: Db): Promise<CatalogExercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, slug, name, movement_pattern, primary_muscles, is_free_weight, default_sets, default_rep_min, default_rep_max, beginner_friendly, machine_types(slug, category)",
    );
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((e) => e.machine_types)
    .map((e) => ({
      id: e.id,
      slug: e.slug ?? e.id,
      name: e.name,
      machine_type_slug: e.machine_types!.slug,
      machine_category: e.machine_types!.category,
      movement_pattern: e.movement_pattern,
      primary_muscles: e.primary_muscles ?? [],
      is_free_weight: !!e.is_free_weight,
      default_sets: e.default_sets ?? 3,
      default_rep_min: e.default_rep_min ?? 8,
      default_rep_max: e.default_rep_max ?? 12,
      beginner_friendly: e.beginner_friendly,
    }));
}

export type EquipmentRow = GymEquipmentItem & {
  machine_type_id: string;
  category: string;
  weight_step_kg: number | null;
  extra_plate_kg: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  photo_path: string | null;
};

export async function loadGymEquipment(supabase: Db, gymId: string): Promise<EquipmentRow[]> {
  const { data, error } = await supabase
    .from("gym_equipment")
    .select("id, status, machine_type_id, weight_step_kg, extra_plate_kg, min_weight_kg, max_weight_kg, photo_path, machine_types(slug, category)")
    .eq("gym_id", gymId)
    .neq("status", "removed");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((e) => e.machine_types && e.machine_type_id)
    .map((e) => ({
      id: e.id,
      status: e.status ?? "pending",
      machine_type_id: e.machine_type_id!,
      machine_type_slug: e.machine_types!.slug,
      category: e.machine_types!.category,
      weight_step_kg: e.weight_step_kg,
      extra_plate_kg: e.extra_plate_kg,
      min_weight_kg: e.min_weight_kg,
      max_weight_kg: e.max_weight_kg,
      photo_path: e.photo_path,
    }));
}

export async function loadPreferences(supabase: Db, userId: string): Promise<Record<string, Preference>> {
  const { data } = await supabase
    .from("exercise_preferences")
    .select("original_exercise_id, replacement_exercise_id, excluded")
    .eq("user_id", userId);
  return Object.fromEntries(
    (data ?? []).map((p) => [p.original_exercise_id, { replacement_exercise_id: p.replacement_exercise_id, excluded: !!p.excluded }]),
  );
}

/** Aktivt program med dage og øvelser i rækkefølge */
export async function loadActiveProgram(supabase: Db, userId: string) {
  const { data: program } = await supabase
    .from("programs")
    .select("id, gym_id, sessions_per_week, version, generated_at")
    .eq("user_id", userId)
    .eq("active", true)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!program) return null;

  const { data: days } = await supabase
    .from("program_days")
    .select(
      "id, day_index, name, program_exercises(id, position, sets, rep_min, rep_max, exercise_id, equipment_id, exercises(id, name, machine_types(slug, name)))",
    )
    .eq("program_id", program.id)
    .order("day_index");

  return {
    ...program,
    days: (days ?? []).map((d) => ({
      ...d,
      program_exercises: [...(d.program_exercises ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    })),
  };
}

/** Næste pas = dagen efter den senest afsluttede i det aktive program (rundt i ring) */
export async function nextProgramDay<T extends { id: string }>(supabase: Db, userId: string, days: T[]): Promise<T | null> {
  if (days.length === 0) return null;
  const { data: last } = await supabase
    .from("workouts")
    .select("program_day_id")
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .in(
      "program_day_id",
      days.map((d) => d.id),
    )
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return days[0];
  const i = days.findIndex((d) => d.id === last.program_day_id);
  return days[(i + 1) % days.length];
}

export async function openWorkout(supabase: Db, userId: string) {
  const { data } = await supabase
    .from("workouts")
    .select("id, program_day_id, started_at")
    .eq("user_id", userId)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export { loadTypeFor };
