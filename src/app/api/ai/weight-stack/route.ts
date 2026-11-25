import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiMode, aiModel } from "@/lib/ai/config";
import { deletePhoto, isValidPhotoPath, loadPhoto } from "@/lib/ai/photo";
import { hasWeightStackQuota, recordUsage } from "@/lib/ai/quota";
import { AiRefusedError, mockReadWeightStack, readWeightStack } from "@/lib/ai/recognize";

/**
 * POST { photoPath } → aflæste vægttrin fra et foto af vægtstakken.
 * Fotoet bruges kun til aflæsningen og slettes bagefter (dataminimering).
 * Er kvoten brugt op, svarer vi { quota: "exceeded" }, og brugeren taster selv vægttrin.
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
  try {
    if (mode === "off") return NextResponse.json({ mode });
    if (!(await hasWeightStackQuota(user.id))) return NextResponse.json({ mode, quota: "exceeded" });

    let usage: { input_tokens: number; output_tokens: number } | null = null;
    const result =
      mode === "mock"
        ? mockReadWeightStack()
        : await readWeightStack(await loadPhoto(supabase, photoPath), (u) => (usage = u));

    await recordUsage({
      userId: user.id,
      feature: "weight_stack",
      model: mode === "mock" ? "mock" : aiModel(),
      usage,
    });

    if (!result.is_weight_stack || result.contains_people) {
      return NextResponse.json({ mode, rejected: result.contains_people ? "people" : "not_stack" });
    }
    return NextResponse.json({ mode, result });
  } catch (e) {
    if (e instanceof AiRefusedError) return NextResponse.json({ mode, failed: "refused" });
    console.error("Aflæsning af vægtstak fejlede:", e);
    return NextResponse.json({ mode, failed: "error" });
  } finally {
    await deletePhoto(supabase, photoPath);
  }
}
