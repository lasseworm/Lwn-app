"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/gyms";
import { t } from "@/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Fjern et husket alternativ/udeladelse */
export async function removePreference(formData: FormData) {
  const id = String(formData.get("exerciseId") ?? "");
  if (!UUID_RE.test(id)) return;
  const { supabase, user } = await requireUser();
  await supabase.from("exercise_preferences").delete().eq("user_id", user.id).eq("original_exercise_id", id);
  revalidatePath("/profil");
}

export type FeedbackState = { sent?: boolean; error?: string };

/** Feedback fra testere – gemmes i tabellen feedback sammen med skærmen */
export async function sendFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  const screen = String(formData.get("screen") ?? "").slice(0, 200) || null;
  if (message.length < 3) return { error: t.feedback.tooShort };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("feedback").insert({ user_id: user.id, message, screen });
  if (error) {
    console.error("sendFeedback:", error.message);
    return { error: t.workout.errors.generic };
  }
  return { sent: true };
}

/** "Ikke nu" til 12-ugers-spørgsmålet: spørg igen om 4 uger */
export async function snoozeReview() {
  const { supabase, user } = await requireUser();
  const until = new Date(Date.now() + 28 * 86_400_000).toISOString();
  await supabase.from("profiles").update({ program_review_snoozed_until: until }).eq("id", user.id);
  revalidatePath("/hjem");
}

export type DeleteState = { error?: string };

/** Slet min konto (GDPR). Selve sletningen sker i databasefunktionen delete_my_account(). */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  if (String(formData.get("confirm") ?? "").trim() !== "SLET") return { error: t.profile.deleteWrongWord };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (/active_subscription/.test(error.message)) return { error: t.profile.deleteActiveSub };
    console.error("delete_my_account:", error.message);
    return { error: t.workout.errors.generic };
  }
  // Sessionen peger nu på en slettet bruger – ryd cookies
  await supabase.auth.signOut();
  redirect("/");
}
