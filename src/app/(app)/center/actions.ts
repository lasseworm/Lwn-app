"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cleanText, requireUser } from "@/lib/gyms";
import { validateWeightSettings } from "@/lib/equipment/weights";
import { deletePhoto, isValidPhotoPath } from "@/lib/ai/photo";
import { t } from "@/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Gør % og _ bogstavelige i et ILIKE-mønster (eksakt, men ufølsom for store/små bogstaver). */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

async function setActiveGym(gymId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_gyms").upsert({ user_id: user.id, gym_id: gymId }, { onConflict: "user_id,gym_id" });
  const { error } = await supabase.from("profiles").update({ active_gym_id: gymId }).eq("id", user.id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Centre
// ---------------------------------------------------------------------------

export async function selectGym(formData: FormData) {
  const gymId = formData.get("gymId");
  if (!isUuid(gymId)) redirect("/center/find");
  await setActiveGym(gymId);
  revalidatePath("/", "layout");
  redirect("/center");
}

export type CreateGymState = { error?: string };

export async function createGym(_prev: CreateGymState, formData: FormData): Promise<CreateGymState> {
  const name = cleanText(formData.get("name"));
  const city = cleanText(formData.get("city"));
  if (name.length < 2 || city.length < 2) return { error: t.gym.errors.nameCity };

  const { supabase, user } = await requireUser();

  // Findes centret allerede (samme navn og by)? Så vælg det i stedet for at lave en dublet.
  const { data: existing } = await supabase
    .from("gyms")
    .select("id")
    .ilike("name", escapeLike(name))
    .ilike("city", escapeLike(city))
    .limit(1)
    .maybeSingle();

  let gymId = existing?.id;
  if (!gymId) {
    const { data, error } = await supabase
      .from("gyms")
      .insert({ name, city, created_by: user.id })
      .select("id")
      .single();
    if (error || !data) {
      console.error("createGym:", error?.message);
      return { error: t.gym.errors.generic };
    }
    gymId = data.id;
  }

  await setActiveGym(gymId);
  revalidatePath("/", "layout");
  redirect(existing ? "/center?notice=exists" : "/center");
}

// ---------------------------------------------------------------------------
// Udstyr
// ---------------------------------------------------------------------------

export type AddEquipmentInput = {
  gymId: string;
  machineTypeId: string;
  photoPath: string | null;
  aiConfidence: number | null;
  customName: string;
  weightStepKg: number | null;
  extraPlateKg: number | null;
  minWeightKg: number | null;
  maxWeightKg: number | null;
};

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

export async function addEquipment(input: AddEquipmentInput): Promise<ActionResult> {
  if (!isUuid(input.gymId) || !isUuid(input.machineTypeId)) return { ok: false, error: t.equipment.errors.chooseType };
  const photoPath = input.photoPath && isValidPhotoPath(input.photoPath) && input.photoPath.startsWith(input.gymId + "/")
    ? input.photoPath
    : null;

  const weights = {
    weight_step_kg: num(input.weightStepKg),
    extra_plate_kg: num(input.extraPlateKg),
    min_weight_kg: num(input.minWeightKg),
    max_weight_kg: num(input.maxWeightKg),
  };
  const weightError = validateWeightSettings(weights);
  if (weightError) return { ok: false, error: weightError };

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("gym_equipment")
    .insert({
      gym_id: input.gymId,
      machine_type_id: input.machineTypeId,
      custom_name: input.customName.replace(/\s+/g, " ").trim().slice(0, 80) || null,
      photo_path: photoPath,
      ai_confidence: input.aiConfidence != null ? Math.min(1, Math.max(0, input.aiConfidence)) : null,
      ...weights,
      status: "pending",
      added_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("addEquipment:", error?.message);
    return { ok: false, error: t.equipment.errors.generic };
  }
  revalidatePath("/center");
  return { ok: true, id: data.id };
}

/** "Det er den samme maskine": brug den eksisterende, og genbrug evt. fotoet, hvis den mangler et. */
export async function pickExistingEquipment(existingId: string, photoPath: string | null): Promise<ActionResult> {
  if (!isUuid(existingId)) return { ok: false, error: t.equipment.errors.generic };
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("gym_equipment")
    .select("id, gym_id, photo_path")
    .eq("id", existingId)
    .maybeSingle();
  if (!existing) return { ok: false, error: t.equipment.errors.generic };

  if (photoPath && isValidPhotoPath(photoPath)) {
    if (!existing.photo_path && photoPath.startsWith(existing.gym_id + "/")) {
      await supabase.from("gym_equipment").update({ photo_path: photoPath }).eq("id", existingId);
    } else {
      await deletePhoto(supabase, photoPath);
    }
  }
  return { ok: true, id: existingId };
}

/**
 * Skifter (eller drejer) maskinens foto. Kun den, der tilføjede maskinen, må skifte et
 * eksisterende foto; mangler maskinen et foto, må alle tilføje et. Det gamle foto slettes.
 */
export async function replaceEquipmentPhoto(equipmentId: string, photoPath: string): Promise<{ ok: boolean }> {
  if (!isUuid(equipmentId) || !isValidPhotoPath(photoPath)) return { ok: false };
  const { supabase, user } = await requireUser();
  const { data: eq } = await supabase
    .from("gym_equipment")
    .select("gym_id, added_by, photo_path")
    .eq("id", equipmentId)
    .maybeSingle();
  const allowed = !!eq && (eq.added_by === user.id || !eq.photo_path) && photoPath.startsWith(eq.gym_id + "/");
  if (!allowed) {
    await deletePhoto(supabase, photoPath);
    return { ok: false };
  }
  const { error } = await supabase.from("gym_equipment").update({ photo_path: photoPath }).eq("id", equipmentId);
  if (error) {
    await deletePhoto(supabase, photoPath);
    return { ok: false };
  }
  if (eq.photo_path && eq.photo_path !== photoPath) await deletePhoto(supabase, eq.photo_path);
  revalidatePath(`/center/udstyr/${equipmentId}`);
  revalidatePath("/center");
  return { ok: true };
}

export async function discardPhoto(photoPath: string) {
  if (!isValidPhotoPath(photoPath)) return;
  const { supabase } = await requireUser();
  await deletePhoto(supabase, photoPath);
}

export async function addStandardEquipment(formData: FormData) {
  const gymId = formData.get("gymId");
  const typeIds = formData.getAll("typeId").filter(isUuid);
  if (!isUuid(gymId)) redirect("/center");
  if (typeIds.length > 0) {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("gym_equipment")
      .select("machine_type_id")
      .eq("gym_id", gymId)
      .neq("status", "removed");
    const have = new Set((existing ?? []).map((e) => e.machine_type_id));
    const rows = typeIds
      .filter((id) => !have.has(id))
      .map((id) => ({ gym_id: gymId, machine_type_id: id, status: "pending", added_by: user.id }));
    if (rows.length) {
      const { error } = await supabase.from("gym_equipment").insert(rows);
      if (error) console.error("addStandardEquipment:", error.message);
    }
  }
  revalidatePath("/center");
  redirect("/center");
}

function readWeightForm(formData: FormData) {
  const n = (k: string) => {
    const raw = String(formData.get(k) ?? "").replace(",", ".").trim();
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
  };
  return {
    weight_step_kg: n("step"),
    extra_plate_kg: n("extra"),
    min_weight_kg: n("min"),
    max_weight_kg: n("max"),
  };
}

export type FormState = { error?: string; saved?: boolean };

export async function updateEquipment(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id");
  if (!isUuid(id)) return { error: t.equipment.errors.generic };
  const weights = readWeightForm(formData);
  if (Object.values(weights).some((v) => Number.isNaN(v))) return { error: "Skriv tal, fx 7 eller 3,5." };
  const weightError = validateWeightSettings(weights);
  if (weightError) return { error: weightError };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("gym_equipment")
    .update({ ...weights, custom_name: cleanText(formData.get("customName")) || null })
    .eq("id", id);
  if (error) return { error: t.equipment.errors.generic };
  revalidatePath(`/center/udstyr/${id}`);
  revalidatePath("/center");
  return { saved: true };
}

/** Opdaterer antal bekræftelser og status ud fra stemmerne. */
async function recountVotes(equipmentId: string) {
  const { supabase } = await requireUser();
  const { data: votes } = await supabase
    .from("equipment_confirmations")
    .select("vote")
    .eq("equipment_id", equipmentId);
  const confirms = (votes ?? []).filter((v) => v.vote === "confirm").length;
  const reports = (votes ?? []).filter((v) => v.vote === "report").length;
  const { data: eq } = await supabase.from("gym_equipment").select("status").eq("id", equipmentId).maybeSingle();
  if (!eq || eq.status === "removed") {
    await supabase.from("gym_equipment").update({ confirmations: confirms }).eq("id", equipmentId);
    return;
  }
  const status = reports > 0 && reports >= confirms ? "disputed" : confirms > 0 ? "verified" : "pending";
  await supabase.from("gym_equipment").update({ confirmations: confirms, status }).eq("id", equipmentId);
}

export async function confirmEquipment(formData: FormData) {
  const id = formData.get("id");
  if (!isUuid(id)) return;
  const { supabase, user } = await requireUser();

  // Kun andre end den, der tilføjede maskinen, kan bekræfte den (fællesskabsbekræftelse)
  const { data: eq } = await supabase.from("gym_equipment").select("added_by").eq("id", id).maybeSingle();
  if (!eq || eq.added_by === user.id) return;

  await supabase
    .from("equipment_confirmations")
    .upsert({ equipment_id: id, user_id: user.id, vote: "confirm", note: null }, { onConflict: "equipment_id,user_id" });
  await recountVotes(id);
  revalidatePath(`/center/udstyr/${id}`);
  revalidatePath("/center");
}

export async function reportEquipment(formData: FormData) {
  const id = formData.get("id");
  if (!isUuid(id)) return;
  const note = cleanText(formData.get("note"), 300) || null;
  const { supabase, user } = await requireUser();
  await supabase
    .from("equipment_confirmations")
    .upsert({ equipment_id: id, user_id: user.id, vote: "report", note }, { onConflict: "equipment_id,user_id" });
  await recountVotes(id);
  revalidatePath(`/center/udstyr/${id}`);
  revalidatePath("/center");
}

export async function setEquipmentRemoved(formData: FormData) {
  const id = formData.get("id");
  const removed = formData.get("removed") === "1";
  if (!isUuid(id)) return;
  const { supabase } = await requireUser();
  await supabase.from("gym_equipment").update({ status: removed ? "removed" : "pending" }).eq("id", id);
  if (!removed) await recountVotes(id);
  revalidatePath(`/center/udstyr/${id}`);
  revalidatePath("/center");
}
