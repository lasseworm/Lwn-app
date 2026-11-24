import type { Metadata } from "next";
import { BackLink, Button, Card, SampleBadge, inputClass } from "@/components/ui";
import { requireUser, sanitizeSearch } from "@/lib/gyms";
import { t } from "@/i18n";
import { selectGym } from "../actions";
import { CreateGymForm } from "./create-gym-form";

export const metadata: Metadata = { title: t.gym.findTitle };

type GymRow = { id: string; name: string; city: string; is_sample: boolean | null };

function GymList({ gyms, activeId }: { gyms: GymRow[]; activeId: string | null }) {
  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {gyms.map((g) => (
          <li key={g.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-base font-semibold">
                <span className="truncate">{g.name}</span>
                {g.is_sample && <SampleBadge label={t.catalog.sampleBadge} />}
              </span>
              <span className="block text-sm text-muted">{g.city}</span>
            </span>
            {g.id === activeId ? (
              <span className="text-sm font-semibold text-muted">{t.gym.active}</span>
            ) : (
              <form action={selectGym}>
                <input type="hidden" name="gymId" value={g.id} />
                <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground">
                  {t.gym.choose}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function FindGymPage(props: PageProps<"/center/find">) {
  const sp = await props.searchParams;
  const rawQ = typeof sp.q === "string" ? sp.q : "";
  const q = sanitizeSearch(rawQ);
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: saved }] = await Promise.all([
    supabase.from("profiles").select("active_gym_id").eq("id", user.id).maybeSingle(),
    supabase.from("user_gyms").select("gyms(id, name, city, is_sample)").eq("user_id", user.id),
  ]);
  const activeId = profile?.active_gym_id ?? null;
  const myGyms = (saved ?? []).map((s) => s.gyms).filter((g): g is GymRow => Boolean(g));

  let results: GymRow[] = [];
  if (q.length >= 2) {
    const pattern = `*${q}*`;
    const { data } = await supabase
      .from("gyms")
      .select("id, name, city, is_sample")
      .or(`name.ilike."${pattern}",city.ilike."${pattern}"`)
      .order("is_sample", { ascending: true })
      .order("name")
      .limit(20);
    results = data ?? [];
  }

  return (
    <main className="space-y-6">
      {activeId && <BackLink href="/center" label={t.gym.title} />}
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.gym.findTitle}</h1>
        <p className="mt-2 text-base text-muted">{t.gym.findIntro}</p>
      </header>

      {myGyms.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">{t.gym.myGyms}</h2>
          <GymList gyms={myGyms} activeId={activeId} />
        </section>
      )}

      <form role="search" className="space-y-3">
        <label htmlFor="q" className="block text-sm font-semibold">
          {t.gym.searchLabel}
        </label>
        <input id="q" name="q" type="search" defaultValue={rawQ} placeholder={t.gym.searchPlaceholder} className={inputClass} autoComplete="off" />
        <Button type="submit" variant="dark">
          {t.gym.search}
        </Button>
      </form>

      {q.length >= 2 &&
        (results.length > 0 ? (
          <GymList gyms={results} activeId={activeId} />
        ) : (
          <p className="text-base text-muted">{t.gym.noResults}</p>
        ))}

      <section>
        <h2 className="mb-3 text-xl font-bold">{t.gym.createTitle}</h2>
        <CreateGymForm defaultName={q} />
      </section>
    </main>
  );
}
