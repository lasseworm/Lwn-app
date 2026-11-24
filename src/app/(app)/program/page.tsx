import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { requireUser } from "@/lib/gyms";
import { loadActiveProgram, nextProgramDay, openWorkout } from "@/lib/training/data";
import { t } from "@/i18n";
import { GenerateForm } from "./generate-form";
import { startWorkout } from "./actions";

export const metadata: Metadata = { title: t.program.title };

const fmtKg = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 2 });

export default async function ProgramPage(props: PageProps<"/program">) {
  const sp = await props.searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: profile }, program, open] = await Promise.all([
    supabase.from("profiles").select("experience_level, sessions_per_week, active_gym_id").eq("id", user.id).maybeSingle(),
    loadActiveProgram(supabase, user.id),
    openWorkout(supabase, user.id),
  ]);

  // Forudsætninger: profil → center → udstyr
  if (!profile?.experience_level) {
    return (
      <Main>
        <Card>
          <p className="text-base">{t.program.needsProfile}</p>
          <ButtonLink href="/onboarding" className="mt-5">
            {t.workout.getStarted}
          </ButtonLink>
        </Card>
      </Main>
    );
  }
  if (!profile.active_gym_id) {
    return (
      <Main>
        <Card>
          <p className="text-base">{t.program.needsGym}</p>
          <ButtonLink href="/center/find" className="mt-5">
            {t.gym.chooseGym}
          </ButtonLink>
        </Card>
      </Main>
    );
  }
  const { count: equipmentCount } = await supabase
    .from("gym_equipment")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", profile.active_gym_id)
    .neq("status", "removed");

  if (!program) {
    return (
      <Main>
        <Card className="space-y-4">
          <p className="text-base">{t.program.none}</p>
          {(equipmentCount ?? 0) === 0 ? (
            <>
              <p className="text-base text-muted">{t.program.needsEquipment}</p>
              <ButtonLink href="/center/tilfoej">{t.gym.addMachine}</ButtonLink>
            </>
          ) : (
            <GenerateForm sessions={profile.sessions_per_week ?? 3} label={t.program.generate} />
          )}
        </Card>
      </Main>
    );
  }

  const next = await nextProgramDay(supabase, user.id, program.days);
  const exerciseIds = program.days.flatMap((d) => d.program_exercises.map((pe) => pe.exercise_id).filter(Boolean) as string[]);
  const { data: progress } = await supabase
    .from("exercise_progress")
    .select("exercise_id, equipment_id, current_weight_kg, current_reps")
    .eq("user_id", user.id)
    .in("exercise_id", exerciseIds.length ? exerciseIds : ["00000000-0000-0000-0000-000000000000"]);
  const progressKey = (e: string | null, q: string | null) => `${e}|${q}`;
  const progressMap = new Map((progress ?? []).map((p) => [progressKey(p.exercise_id, p.equipment_id), p]));

  const missing = typeof sp.mangler === "string" ? sp.mangler.split(",").map((g) => t.program.muscleGroups[g] ?? g) : [];

  return (
    <Main>
      <p className="-mt-3 text-sm text-muted">
        {t.program.version(program.version ?? 1, program.generated_at ? new Date(program.generated_at).toLocaleDateString("da-DK") : "")}
      </p>

      {missing.length > 0 && (
        <p role="status" className="rounded-2xl border border-border bg-surface p-4 text-sm">
          {t.program.uncovered(missing.join(", "))}
        </p>
      )}

      {program.days.map((day) => {
        const isNext = next?.id === day.id;
        return (
          <Card key={day.id} className={isNext ? "border-accent/60" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{day.name}</h2>
                <p className="text-sm text-muted">
                  {isNext && <span className="font-semibold text-accent-text">{t.program.next} · </span>}
                  {t.program.exercisesCount(day.program_exercises.length)}
                </p>
              </div>
              <form action={startWorkout}>
                <input type="hidden" name="dayId" value={day.id} />
                <button
                  type="submit"
                  className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
                    isNext ? "bg-accent text-accent-foreground" : "border border-border"
                  }`}
                >
                  {open?.program_day_id === day.id ? t.workout.resume : t.program.start}
                </button>
              </form>
            </div>
            <ol className="mt-4 divide-y divide-border">
              {day.program_exercises.map((pe) => {
                const p = progressMap.get(progressKey(pe.exercise_id, pe.equipment_id));
                return (
                  <li key={pe.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold">{pe.exercises?.name}</span>
                      <span className="block text-sm text-muted">
                        {t.program.setsReps(pe.sets ?? 0, pe.rep_min ?? 0, pe.rep_max ?? 0)}
                        {p?.current_weight_kg != null && ` · ${fmtKg(p.current_weight_kg)} kg × ${p.current_reps}`}
                      </span>
                    </span>
                    {pe.exercises?.machine_types?.slug && (
                      <Link
                        href={`/katalog/${pe.exercises.machine_types.slug}`}
                        className="shrink-0 text-sm font-semibold text-muted underline underline-offset-2"
                      >
                        {t.workout.instructions}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        );
      })}

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t.program.regenerate}</h2>
        <p className="text-sm text-muted">{t.program.regenerateHint}</p>
        <GenerateForm sessions={program.sessions_per_week ?? profile.sessions_per_week ?? 3} label={t.program.regenerate} secondary />
      </Card>
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">{t.program.title}</h1>
      {children}
    </main>
  );
}
