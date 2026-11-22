import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui";
import { getActiveGym } from "@/lib/gyms";
import { aiMode } from "@/lib/ai/config";
import { t } from "@/i18n";
import { AddEquipmentWizard } from "./wizard";

export const metadata: Metadata = { title: t.equipment.addTitle };

export default async function AddEquipmentPage() {
  const { supabase, gym } = await getActiveGym();
  if (!gym) redirect("/center/find");

  const [{ data: catalog }, { data: existing }] = await Promise.all([
    supabase
      .from("machine_types")
      .select("id, slug, name, category, is_multipurpose, primary_muscles")
      .order("name"),
    supabase
      .from("gym_equipment")
      .select("id, machine_type_id, custom_name, photo_path, updated_at")
      .eq("gym_id", gym.id)
      .neq("status", "removed"),
  ]);

  return (
    <main className="space-y-5">
      <BackLink href="/center" label={gym.name} />
      <h1 className="text-3xl font-black tracking-tight">{t.equipment.addTitle}</h1>
      <AddEquipmentWizard
        gymId={gym.id}
        mode={aiMode()}
        catalog={(catalog ?? []).map((m) => ({ ...m, primary_muscles: m.primary_muscles ?? [], is_multipurpose: !!m.is_multipurpose }))}
        existing={existing ?? []}
      />
    </main>
  );
}
