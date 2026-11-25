import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, SampleBadge } from "@/components/ui";
import { ExerciseIllustration } from "@/components/exercise-illustration";
import { createClient } from "@/lib/supabase/server";
import { muscleName, t } from "@/i18n";

type Instructions = Partial<{
  adjustment: string[];
  start_position: string;
  steps: string[];
  breathing: string;
  common_mistakes: string[];
  safety: string[];
  beginner_setting: string;
}>;

const SECTION_ORDER = [
  "adjustment",
  "start_position",
  "steps",
  "breathing",
  "common_mistakes",
  "safety",
  "beginner_setting",
] as const;

async function getMachine(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("machine_types")
    .select(
      "id, slug, name, category, is_multipurpose, primary_muscles, secondary_muscles, instructions, is_sample, exercises(slug, name, primary_muscles, is_free_weight, default_sets, default_rep_min, default_rep_max)",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata(props: PageProps<"/katalog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const m = await getMachine(slug);
  return { title: m?.name ?? t.catalog.title };
}

export default async function MachinePage(props: PageProps<"/katalog/[slug]">) {
  const { slug } = await props.params;
  const m = await getMachine(slug);
  if (!m) notFound();

  const ins = (m.instructions ?? {}) as Instructions;

  return (
    <main className="space-y-5">
      <Link href="/katalog" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted">
        ‹ {t.catalog.back}
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted">
            {t.categories[m.category] ?? m.category}
          </span>
          {m.is_sample && <SampleBadge label={t.catalog.sampleBadge} />}
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{m.name}</h1>
      </header>

      <Card>
        {m.is_multipurpose ? (
          <p className="text-base text-muted">{t.catalog.noFixedMuscles}</p>
        ) : (
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-semibold text-muted">{t.catalog.primary}</dt>
              <dd className="text-base font-semibold">{(m.primary_muscles ?? []).map(muscleName).join(", ")}</dd>
            </div>
            {(m.secondary_muscles ?? []).length > 0 && (
              <div>
                <dt className="text-sm font-semibold text-muted">{t.catalog.secondary}</dt>
                <dd className="text-base">{(m.secondary_muscles ?? []).map(muscleName).join(", ")}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      {SECTION_ORDER.filter((k) => ins[k] && (!Array.isArray(ins[k]) || ins[k]!.length > 0)).map((k) => {
        const value = ins[k]!;
        return (
          <Card key={k}>
            <h2 className="text-lg font-bold">{t.catalog.sections[k]}</h2>
            {Array.isArray(value) ? (
              k === "steps" ? (
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base leading-relaxed">
                  {value.map((v) => <li key={v}>{v}</li>)}
                </ol>
              ) : (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-relaxed">
                  {value.map((v) => <li key={v}>{v}</li>)}
                </ul>
              )
            ) : (
              <p className="mt-2 text-base leading-relaxed">{value}</p>
            )}
          </Card>
        );
      })}

      {m.exercises && m.exercises.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold">{t.catalog.exercises}</h2>
          <ul className="mt-2 divide-y divide-border">
            {m.exercises.map((e) => (
              <li key={e.slug} className="py-3">
                <span className="block text-base font-semibold">{e.name}</span>
                <span className="block text-sm text-muted">
                  {e.default_sets} × {e.default_rep_min}–{e.default_rep_max} · {(e.primary_muscles ?? []).map(muscleName).join(", ")}
                </span>
                <ExerciseIllustration slug={e.slug} className="mt-2 max-w-xs" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-sm leading-relaxed text-muted">{t.catalog.healthNote}</p>
    </main>
  );
}
