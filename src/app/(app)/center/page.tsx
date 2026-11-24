import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Card, SampleBadge, StatusBadge } from "@/components/ui";
import { getActiveGym } from "@/lib/gyms";
import { PHOTO_BUCKET } from "@/lib/ai/photo";
import { muscleName, t } from "@/i18n";

export const metadata: Metadata = { title: t.gym.title };

const CATEGORY_ORDER = ["machine", "multi", "free_weight", "accessory", "cardio"];

export default async function CenterPage(props: PageProps<"/center">) {
  const { supabase, gym } = await getActiveGym();
  if (!gym) redirect("/center/find");
  const sp = await props.searchParams;

  const { data: equipment } = await supabase
    .from("gym_equipment")
    .select("id, custom_name, status, photo_path, machine_types(name, category, primary_muscles, is_multipurpose)")
    .eq("gym_id", gym.id)
    .order("updated_at", { ascending: false });

  const visible = (equipment ?? []).filter((e) => e.status !== "removed");
  const { count: programCount } = await supabase
    .from("programs")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  const hasProgram = (programCount ?? 0) > 0;
  const removedCount = (equipment ?? []).length - visible.length;

  const paths = visible.map((e) => e.photo_path).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  const groups = CATEGORY_ORDER.map((c) => ({
    category: c,
    items: visible.filter((e) => e.machine_types?.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t.gym.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">{gym.name}</h1>
          {gym.is_sample && <SampleBadge label={t.catalog.sampleBadge} />}
        </div>
        <p className="mt-1 text-base text-muted">
          {gym.city} · {t.gym.equipmentCount(visible.length)}
          {removedCount > 0 && ` · ${t.gym.removedCount(removedCount)}`}
        </p>
        <Link href="/center/find" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
          {t.gym.switchGym}
        </Link>
      </header>

      {visible.length > 0 && !hasProgram && (
        <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4">
          <p className="text-base font-semibold">{t.program.none}</p>
          <ButtonLink href="/program" className="mt-3">
            {t.program.generate}
          </ButtonLink>
        </div>
      )}

      {sp.notice === "exists" && (
        <p role="status" className="rounded-2xl border border-border bg-surface p-4 text-sm">
          {t.gym.existsNotice}
        </p>
      )}

      <div className="grid gap-3">
        <ButtonLink href="/center/tilfoej">{t.gym.addMachine}</ButtonLink>
        <ButtonLink href="/center/standardudstyr" variant="secondary">
          {t.gym.addStandard}
        </ButtonLink>
      </div>

      {visible.length === 0 && (
        <Card>
          <p className="text-base text-muted">{t.gym.emptyEquipment}</p>
        </Card>
      )}

      {groups.map((g) => (
        <section key={g.category}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">
            {t.categories[g.category] ?? g.category}
          </h2>
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {g.items.map((e) => {
                const mt = e.machine_types;
                const thumb = e.photo_path ? signed.get(e.photo_path) : undefined;
                return (
                  <li key={e.id}>
                    <Link href={`/center/udstyr/${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- signerede URL'er udløber; next/image giver ingen gevinst her
                        <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span aria-hidden className="h-12 w-12 shrink-0 rounded-xl bg-background" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">{mt?.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {e.custom_name ??
                            (mt?.is_multipurpose ? t.catalog.multipurpose : (mt?.primary_muscles ?? []).map(muscleName).join(", "))}
                        </span>
                      </span>
                      <StatusBadge status={e.status ?? "pending"} label={t.equipment.status[e.status ?? "pending"]} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </main>
  );
}
