"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/gyms";
import { generateProgram, type Experience } from "@/lib/training/generator";
import { loadCatalog, loadGymEquipment, loadPreferences, openWorkout } from "@/lib/training/data";
import { t } from "@/i18n";

const EXPERIENCE = ["beginner", "returning", "intermediate"] as const;
const GOALS = ["strength", "muscle", "health", "habit"] as const;

export type FormState = { error?: string };

/** Onboarding: erfaring, mål, pas/uge (+ opvarmning). Sender videre til næste trin i flowet. */
export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const experience = String(formData.get("experience") ?? "");
  const goal = String(formData.get("goal") ?? "");
  const sessions = Number(formData.get("sessions"));
  if (!EXPERIENCE.includes(experience as Experience) || !GOALS.includes(goal as (typeof GOALS)[number]) || ![2, 3, 4].includes(sessions)) {
    return { error: t.onboarding.errors.missing };
  }

  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      experience_level: experience,
      goal,
      sessions_per_week: sessions,
      warmup_enabled: formData.get("warmup") === "on",
    })
    .eq("id", user.id)
    .select("active_gym_id")
    .single();
  if (error) {
    console.error("saveProfile:", error.message);
    return { error: t.workout.errors.generic };
  }

  revalidatePath("/", "layout");
  // Fra profilsiden: tilbage dertil. Fra onboarding: næste trin (center → udstyr → program)
  if (formData.get("returnTo") === "/profil") redirect("/profil?gemt=1");
  redirect(profile.active_gym_id ? "/program" : "/center/find");
}

export type GenerateState = { error?: string; uncovered?: string[] };

/** Generér (eller generér nyt) program ud fra profil, aktivt center, udstyr og præferencer */
export async function createProgram(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("experience_level, sessions_per_week, active_gym_id")
    .eq("id", user.id)
    .single();
  if (!profile?.experience_level) redirect("/onboarding");
  if (!profile.active_gym_id) redirect("/center/find");

  const requested = Number(formData.get("sessions"));
  const sessions = ([2, 3, 4].includes(requested) ? requested : (profile.sessions_per_week ?? 3)) as 2 | 3 | 4;

  const [catalog, equipment, preferences] = await Promise.all([
    loadCatalog(supabase),
    loadGymEquipment(supabase, profile.active_gym_id),
    loadPreferences(supabase, user.id),
  ]);

  const program = generateProgram({
    sessionsPerWeek: sessions,
    experience: profile.experience_level as Experience,
    catalog,
    equipment,
    preferences,
    moreFreeWeights: formData.get("moreFreeWeights") === "on",
  });

  if (program.days.length === 0 || program.days.every((d) => d.exercises.length < 3)) {
    return { error: t.program.tooLittleEquipment };
  }

  const { error } = await supabase.rpc("create_program", {
    p_gym_id: profile.active_gym_id,
    p_sessions_per_week: sessions,
    p_days: program.days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map(({ exercise_id, equipment_id, sets, rep_min, rep_max }) => ({
        exercise_id,
        equipment_id,
        sets,
        rep_min,
        rep_max,
      })),
    })),
  });
  if (error) {
    console.error("create_program:", error.message);
    return { error: t.workout.errors.generic };
  }

  revalidatePath("/", "layout");
  redirect(program.uncovered.length ? `/program?mangler=${program.uncovered.join(",")}` : "/program");
}

/** Start et pas (eller fortsæt et åbent) */
export async function startWorkout(formData: FormData) {
  const dayId = String(formData.get("dayId") ?? "");
  const { supabase, user } = await requireUser();

  const open = await openWorkout(supabase, user.id);
  if (open) redirect(`/traening/${open.id}`);

  const { data: day } = await supabase
    .from("program_days")
    .select("id, programs(gym_id, user_id, active)")
    .eq("id", dayId)
    .maybeSingle();
  if (!day || day.programs?.user_id !== user.id) redirect("/program");

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, gym_id: day.programs?.gym_id ?? null, program_day_id: day.id })
    .select("id")
    .single();
  if (error || !workout) {
    console.error("startWorkout:", error?.message);
    redirect("/program");
  }
  revalidatePath("/hjem");
  redirect(`/traening/${workout.id}`);
}
