import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ImageInput } from "./recognize";

export const PHOTO_BUCKET = "equipment-photos";

/** Stier har formen "<gym-id>/<uuid>.jpg" – alt andet afvises. */
const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

export function isValidPhotoPath(path: unknown): path is string {
  return typeof path === "string" && PATH_RE.test(path);
}

const MAX_BYTES = 5 * 1024 * 1024;

/** Henter et uploadet foto (via brugerens egen session, så RLS gælder) som base64. */
export async function loadPhoto(supabase: SupabaseClient<Database>, path: string): Promise<ImageInput> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(path);
  if (error || !data) throw new Error(`Kunne ikke hente foto: ${error?.message ?? "ukendt fejl"}`);
  if (data.size > MAX_BYTES) throw new Error("Fotoet er for stort.");
  const buf = Buffer.from(await data.arrayBuffer());
  return { base64: buf.toString("base64"), mediaType: "image/jpeg" };
}

/** Sletter et foto, brugeren selv har uploadet (RLS tillader kun sletning af egne filer). */
export async function deletePhoto(supabase: SupabaseClient<Database>, path: string) {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) console.error("Kunne ikke slette foto:", error.message);
}
