import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink, Button, Card } from "@/components/ui";
import { getActiveGym } from "@/lib/gyms";
import { t } from "@/i18n";
import { addStandardEquipment } from "../actions";

export const metadata: Metadata = { title: t.equipment.standardTitle };

// Udstyr der typisk bare skal krydses af – ingen foto eller vægttrin nødvendigt.
const STANDARD_CATEGORIES = ["accessory", "free_weight", "multi", "cardio"];

export default async function StandardEquipmentPage() {
  const { supabase, gym } = await getActiveGym();
  if (!gym) redirect("/center/find");

  const [{ data: types }, { data: existing }] = await Promise.all([
    supabase.from("machine_types").select("id, name, category").in("category", STANDARD_CATEGORIES).order("name"),
    supabase.from("gym_equipment").select("machine_type_id").eq("gym_id", gym.id).neq("status", "removed"),
  ]);
  const have = new Set((existing ?? []).map((e) => e.machine_type_id));

  return (
    <main className="space-y-5">
      <BackLink href="/center" label={gym.name} />
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.equipment.standardTitle}</h1>
        <p className="mt-2 text-base text-muted">{t.equipment.standardIntro}</p>
      </header>

      <form action={addStandardEquipment} className="space-y-5">
        <input type="hidden" name="gymId" value={gym.id} />
        {STANDARD_CATEGORIES.map((c) => {
          const items = (types ?? []).filter((m) => m.category === c);
          if (!items.length) return null;
          return (
            <section key={c}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">{t.categories[c]}</h2>
              <Card className="p-0">
                <ul className="divide-y divide-border">
                  {items.map((m) => {
                    const added = have.has(m.id);
                    return (
                      <li key={m.id}>
                        <label className={`flex min-h-14 items-center gap-4 px-5 py-2 ${added ? "opacity-60" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            name="typeId"
                            value={m.id}
                            disabled={added}
                            defaultChecked={added}
                            className="h-6 w-6 shrink-0 accent-[var(--accent)]"
                          />
                          <span className="flex-1 text-base font-semibold">{m.name}</span>
                          {added && <span className="text-xs text-muted">{t.equipment.alreadyAdded}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          );
        })}
        <div className="sticky bottom-20 pt-2">
          <Button type="submit">{t.equipment.standardSave}</Button>
        </div>
      </form>
    </main>
  );
}
