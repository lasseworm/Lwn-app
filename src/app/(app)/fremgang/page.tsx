import type { Metadata } from "next";
import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { LineChart } from "@/components/line-chart";
import { requireUser } from "@/lib/gyms";
import {
  exerciseSeries,
  percentChange,
  periodRanges,
  records,
  recordsInRange,
  summarize,
  type PeriodKey,
  type SetRow,
  type WorkoutRow,
} from "@/lib/training/stats";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.progress.title };

const PERIODS: PeriodKey[] = ["week", "month", "half", "year"];
const fmtKg = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 1 });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

export default async function ProgressPage(props: PageProps<"/fremgang">) {
  const sp = await props.searchParams;
  const period: PeriodKey = PERIODS.includes(sp.periode as PeriodKey) ? (sp.periode as PeriodKey) : "month";
  const { supabase, user } = await requireUser();
  const now = new Date();
  const since = new Date(now.getTime() - 2 * 365 * 86_400_000).toISOString();

  const [{ data: profile }, { data: firstProgram }, { data: workoutRows }] = await Promise.all([
    supabase.from("profiles").select("sessions_per_week").eq("id", user.id).maybeSingle(),
    supabase.from("programs").select("generated_at").eq("user_id", user.id).order("generated_at").limit(1).maybeSingle(),
    supabase
      .from("workouts")
      .select("id, finished_at")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("finished_at", since)
      .order("finished_at"),
  ]);
  const workouts: WorkoutRow[] = (workoutRows ?? []).map((w) => ({ id: w.id, finished_at: w.finished_at! }));

  if (workouts.length === 0) {
    return (
      <main className="space-y-5">
        <h1 className="text-3xl font-black tracking-tight">{t.progress.title}</h1>
        <Card>
          <p className="text-base">{t.progress.empty}</p>
        </Card>
      </main>
    );
  }

  const { data: setRows } = await supabase
    .from("workout_sets")
    .select("workout_id, exercise_id, weight_kg, reps, completed, is_warmup, exercises(name)")
    .in(
      "workout_id",
      workouts.map((w) => w.id),
    );
  const sets: SetRow[] = (setRows ?? []).map((s) => ({
    workout_id: s.workout_id ?? "",
    exercise_id: s.exercise_id ?? "",
    weight_kg: s.weight_kg,
    reps: s.reps ?? 0,
    completed: !!s.completed,
    is_warmup: !!s.is_warmup,
  }));
  const names = new Map((setRows ?? []).map((s) => [s.exercise_id ?? "", s.exercises?.name ?? ""]));

  const { current, previous } = periodRanges(period, now);
  const plannedSince = firstProgram?.generated_at ? new Date(firstProgram.generated_at) : null;
  const cur = summarize(workouts, sets, current, profile?.sessions_per_week ?? null, plannedSince);
  const prev = summarize(workouts, sets, previous, profile?.sessions_per_week ?? null, plannedSince);

  const recs = records(workouts, sets).sort((a, b) => (names.get(a.exercise_id) ?? "").localeCompare(names.get(b.exercise_id) ?? "", "da"));
  const fresh = new Set(recordsInRange(recs, current).map((r) => r.exercise_id));

  // Øvelser til grafen: flest pas først
  const countByExercise = new Map<string, number>();
  for (const id of new Set(sets.filter((s) => s.completed && !s.is_warmup).map((s) => `${s.workout_id}|${s.exercise_id}`)))
    countByExercise.set(id.split("|")[1], (countByExercise.get(id.split("|")[1]) ?? 0) + 1);
  const chartExercises = [...countByExercise.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const selected = typeof sp.ovelse === "string" && countByExercise.has(sp.ovelse) ? sp.ovelse : chartExercises[0];
  const series = selected ? exerciseSeries(workouts, sets, selected) : [];
  const bodyweight = series.every((p) => p.weight == null || p.weight === 0);
  const chartPoints = series.map((p) => ({
    date: p.date,
    value: bodyweight ? p.reps : (p.weight ?? 0),
    label: bodyweight ? `${p.reps} reps` : `${fmtKg(p.weight ?? 0)} kg × ${p.reps}`,
  }));

  const href = (q: Record<string, string>) => `/fremgang?${new URLSearchParams({ periode: period, ...(selected ? { ovelse: selected } : {}), ...q })}`;

  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">{t.progress.title}</h1>

      {/* Periodevalg */}
      <nav aria-label="Periode" className="grid grid-cols-4 gap-1 rounded-2xl bg-surface p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={href({ periode: p })}
            aria-current={p === period ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold ${
              p === period ? "bg-brand text-brand-foreground" : "text-muted"
            }`}
          >
            {t.progress.periods[p]}
          </Link>
        ))}
      </nav>

      {/* Nøgletal med sammenligning */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t.progress.sessions} value={String(cur.sessions)} delta={percentChange(cur.sessions, prev.sessions)} period={period} />
        <StatTile label={t.progress.sets} value={String(cur.sets)} delta={percentChange(cur.sets, prev.sets)} period={period} />
        <StatTile
          label={t.progress.volume}
          value={cur.volumeKg >= 10_000 ? `${fmtKg(cur.volumeKg / 1000)} t` : `${cur.volumeKg.toLocaleString("da-DK")} kg`}
          delta={percentChange(cur.volumeKg, prev.volumeKg)}
          period={period}
        />
        <StatTile
          label={t.progress.regularity}
          value={cur.regularity == null ? "–" : `${Math.round(cur.regularity * 100)} %`}
          hint={t.progress.regularityHint}
          delta={cur.regularity != null && prev.regularity != null ? Math.round((cur.regularity - prev.regularity) * 100) : null}
          deltaIsPoints
          period={period}
        />
      </div>

      {/* Graf pr. øvelse */}
      <Card className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">{selected ? names.get(selected) : t.progress.chartTitle}</h2>
          <p className="text-sm text-muted">{t.progress.chartHint}</p>
        </div>
        <nav aria-label={t.progress.chooseExercise} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chartExercises.map((id) => (
            <Link
              key={id}
              href={href({ ovelse: id })}
              aria-current={id === selected ? "true" : undefined}
              className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold ${
                id === selected ? "border-accent bg-accent/15" : "border-border text-muted"
              }`}
            >
              {names.get(id)}
            </Link>
          ))}
        </nav>
        {chartPoints.length >= 2 ? (
          <>
            <LineChart points={chartPoints} unit={bodyweight ? "reps" : "kg"} title={names.get(selected!) ?? ""} />
            <details>
              <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold underline underline-offset-2">
                {t.progress.showTable}
              </summary>
              <table className="mt-2 w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 font-semibold">{t.progress.date}</th>
                    {!bodyweight && <th className="py-1 text-right font-semibold">{t.progress.weight}</th>}
                    <th className="py-1 text-right font-semibold">{t.progress.reps}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...series].reverse().map((p) => (
                    <tr key={p.date} className="border-t border-border">
                      <td className="py-1.5">{fmtDate(p.date)}</td>
                      {!bodyweight && <td className="py-1.5 text-right">{fmtKg(p.weight ?? 0)} kg</td>}
                      <td className="py-1.5 text-right">{p.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p className="text-sm text-muted">{t.progress.tooFew}</p>
        )}
      </Card>

      {/* Rekorder */}
      <Card className="p-0">
        <div className="px-5 pt-5">
          <h2 className="text-lg font-bold">{t.progress.records}</h2>
          {fresh.size > 0 && <p className="text-sm text-muted">{t.progress.newRecords(fresh.size)}</p>}
        </div>
        <ul className="mt-2 divide-y divide-border">
          {recs.map((r) => (
            <li key={r.exercise_id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-base font-semibold">
                  <span className="truncate">{names.get(r.exercise_id)}</span>
                  {fresh.has(r.exercise_id) && (
                    <span className="shrink-0 rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-xs font-semibold">
                      {t.progress.newBadge}
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted">
                  {r.heaviest
                    ? `${t.progress.heaviest}: ${fmtKg(r.heaviest.weight)} kg × ${r.heaviest.reps}`
                    : `${t.progress.mostReps}: ${r.mostReps?.reps ?? 0}`}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">{fmtDate((r.heaviest ?? r.mostReps)!.date)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

function StatTile({
  label,
  value,
  hint,
  delta,
  deltaIsPoints,
  period,
}: {
  label: string;
  value: string;
  hint?: string;
  delta: number | null;
  deltaIsPoints?: boolean;
  period: PeriodKey;
}) {
  const vs = t.progress.vsPrevious[period];
  const Icon = delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const text =
    delta == null
      ? t.progress.newVsNothing(vs)
      : delta === 0
        ? t.progress.noChange(vs)
        : deltaIsPoints
          ? `${delta > 0 ? "+" : ""}${delta} %-point mod ${vs}`
          : t.progress.change(delta, vs);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <p className="mt-2 flex items-start gap-1 text-xs text-muted">
        {Icon && <Icon aria-hidden size={14} className="mt-px shrink-0" />}
        {text}
      </p>
    </div>
  );
}
