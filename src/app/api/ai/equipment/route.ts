import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiMode } from "@/lib/ai/config";
import { deletePhoto, isValidPhotoPath, loadPhoto } from "@/lib/ai/photo";
import { AiRefusedError, mockRecognizeEquipment, recognizeEquipment } from "@/lib/ai/recognize";

/**
 * POST { photoPath } → forslag til maskintype.
 * Fotoet slettes igen, hvis det ikke forestiller udstyr eller viser personer.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { photoPath?: unknown } | null;
  const photoPath = body?.photoPath;
  if (!isValidPhotoPath(photoPath)) return NextResponse.json({ error: "invalid_path" }, { status: 400 });

  const mode = aiMode();
  if (mode === "off") return NextResponse.json({ mode });

  const { data: catalog, error } = await supabase
    .from("machine_types")
    .select("slug, name, category")
    .order("slug");
  if (error || !catalog?.length) return NextResponse.json({ error: "catalog" }, { status: 500 });

  try {
    const result =
      mode === "mock"
        ? mockRecognizeEquipment(catalog)
        : await recognizeEquipment(await loadPhoto(supabase, photoPath), catalog);

    if (!result.is_equipment || result.contains_people) {
      await deletePhoto(supabase, photoPath);
      return NextResponse.json({
        mode,
        rejected: result.contains_people ? "people" : "not_equipment",
      });
    }
    return NextResponse.json({ mode, result });
  } catch (e) {
    if (e instanceof AiRefusedError) return NextResponse.json({ mode, failed: "refused" });
    console.error("AI-genkendelse fejlede:", e);
    return NextResponse.json({ mode, failed: "error" });
  }
}
