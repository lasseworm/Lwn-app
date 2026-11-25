import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Eksportér mine data (GDPR, art. 20): alle brugerens egne oplysninger som JSON.
 * Hentes med brugerens egen session, så RLS sikrer, at kun egne rækker kommer med.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const uid = user.id;
  const [profile, userGyms, programs, workouts, progress, preferences, feedback, equipment, confirmations, subscription, aiUsage] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_gyms").select("label, gyms(id, name, city)").eq("user_id", uid),
      supabase
        .from("programs")
        .select("*, program_days(*, program_exercises(*, exercises(name)))")
        .eq("user_id", uid)
        .order("generated_at"),
      supabase.from("workouts").select("*, workout_sets(*, exercises(name))").eq("user_id", uid).order("started_at"),
      supabase.from("exercise_progress").select("*, exercises(name)").eq("user_id", uid),
      supabase.from("exercise_preferences").select("*").eq("user_id", uid),
      supabase.from("feedback").select("*").eq("user_id", uid),
      supabase.from("gym_equipment").select("id, gym_id, custom_name, status, updated_at, machine_types(name)").eq("added_by", uid),
      supabase.from("equipment_confirmations").select("*").eq("user_id", uid),
      supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end, created_at").eq("user_id", uid).maybeSingle(),
      supabase.from("ai_usage").select("*").eq("user_id", uid),
    ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at },
    profile: profile.data,
    gyms: userGyms.data ?? [],
    programs: programs.data ?? [],
    workouts: workouts.data ?? [],
    exercise_progress: progress.data ?? [],
    exercise_preferences: preferences.data ?? [],
    feedback: feedback.data ?? [],
    equipment_added: equipment.data ?? [],
    equipment_votes: confirmations.data ?? [],
    subscription: subscription.data,
    ai_usage: aiUsage.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lwn-mine-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
