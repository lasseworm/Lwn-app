import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";

const BUCKET = "equipment-photos";

/** Komprimerer (og evt. drejer) et foto i browseren og uploader det som "<gym-id>/<uuid>.jpg". */
export async function uploadEquipmentPhoto(gymId: string, file: Blob, quarterTurns = 0): Promise<string> {
  const blob = await compressImage(file, 1280, 0.8, quarterTurns);
  const path = `${gymId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
