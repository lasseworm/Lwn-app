import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink, Card, Logo } from "@/components/ui";
import { loadActiveProgram, nextProgramDay, openWorkout } from "@/lib/training/data";
import { createProgram, startWorkout } from "../program/actions";
import { snoozeReview } from "../profil/actions";
import { shouldOfferProgramReview } from "@/lib/training/stats";
import { tipOfTheDay } from "@/content/tips";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { ReviewForm } from "./review-form";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.nav.home };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, machineTypes, exercises] = await Promise.all([
    supabase.from("profiles").select("display_name, experience_level, sessions_per_week, program_review_snoozed_until, active_gym_id, gyms!profiles_active_gym_id_fkey(id, name, city)").eq("id", user.id).maybeSingle(),
    supabase.from("machine_types").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
  ]);

  const gym = profile?.gyms ?? null;
  const equipmentCount = gym
    ? (
        await supabase
          .from("gym_equipment")
          .select("id", { count: "exact", head: true })
          .eq("gym_id", gym.id)
          .neq("status", "removed")
      ).count ?? 0
    : 0;

  const [program, open] = await Promise.all([loadActiveProgram(supabase, user.id), openWorkout(supabase, user.id)]);
  const next = program ? await nextProgramDay(supabase, user.id, program.days) : null;
  const onboarded = !!profile?.experience_level;

  // 12-ugers-spørgsmålet (byggeplan 3.5)
  const now = new Date();
  let offerReview = false;
  if (program?.generated_at) {
    const { count } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("finished_at", program.generated_at);
    offerReview = shouldOfferProgramReview({
      programGeneratedAt: program.generated_at,
      sessionsPerWeek: program.sessions_per_week ?? profile?.sessions_per_week ?? null,
      finishedSinceProgram: count ?? 0,
      snoozedUntil: profile?.program_review_snoozed_until ?? null,
      now,
    });
  }
  const tip = tipOfTheDay(now);

  return (
    <main className="space-y-5">
      <header className="flex items-center justify-between">
        <Logo className="h-10" eager />
        <form action={signOut}>
          <button type="submit" className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted hover:text-foreground">
            {t.home.signOut}
          </button>
        </form>
      </header>

      <section>
        <h1 className="text-3xl font-black tracking-tight">{t.home.greeting(profile?.display_name)}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.home.signedInAs} {user.email}
        </p>
      </section>

      {offerReview && (
        <Card className="space-y-4 border-accent/60">
          <div>
            <h2 className="text-xl font-bold">{t.review.title}</h2>
            <p className="mt-1 text-base">{t.review.text}</p>
          </div>
          <ReviewForm action={createProgram} sessions={program?.sessions_per_week ?? profile?.sessions_per_week ?? 3} />
          <form action={snoozeReview}>
            <button type="submit" className="min-h-11 w-full text-sm font-semibold text-muted underline underline-offset-2">
              {t.review.snooze}
            </button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.home.nextUp}</h2>
        {open ? (
          <>
            <p className="mt-2 text-2xl font-black tracking-tight">
              {program?.days.find((d) => d.id === open.program_day_id)?.name ?? t.home.nextUp}
            </p>
            <ButtonLink href={`/traening/${open.id}`} className="mt-5">
              {t.workout.resume}
            </ButtonLink>
          </>
        ) : next ? (
          <>
            <p className="mt-2 text-2xl font-black tracking-tight">{next.name}</p>
            <p className="text-base text-muted">
              {t.program.exercisesCount(next.program_exercises.length)}
            </p>
            <form action={startWorkout} className="mt-5">
              <input type="hidden" name="dayId" value={next.id} />
              <Button type="submit">{t.workout.startNow}</Button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-3 text-base leading-relaxed">
              {!onboarded ? t.program.needsProfile : !gym ? t.program.needsGym : equipmentCount === 0 ? t.program.needsEquipment : t.home.noProgramYet}
            </p>
            <ButtonLink
              href={!onboarded ? "/onboarding" : !gym ? "/center/find" : equipmentCount === 0 ? "/center/tilfoej" : "/program"}
              className="mt-5"
            >
              {!onboarded ? t.workout.getStarted : !gym ? t.gym.chooseGym : equipmentCount === 0 ? t.gym.addMachine : t.program.generate}
            </ButtonLink>
          </>
        )}
      </Card>

      <Card className="border-accent/40">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
          <Lightbulb aria-hidden size={16} className="text-accent-text" />
          {t.tips.tipOfDay}
        </h2>
        <p className="mt-2 text-xl font-bold">{tip.title}</p>
        <p className="mt-1 text-base leading-relaxed">{tip.text}</p>
        <Link href="/tips" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
          {t.tips.seeAll}
        </Link>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.gym.title}</h2>
        {gym ? (
          <>
            <p className="mt-2 text-2xl font-black tracking-tight">{gym.name}</p>
            <p className="text-base text-muted">
              {gym.city} · {t.gym.equipmentCount(equipmentCount)}
            </p>
            <ButtonLink href="/center" variant="secondary" className="mt-5">
              {equipmentCount === 0 ? t.gym.addMachine : t.gym.title}
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="mt-2 text-base">{t.gym.noGym}</p>
            <ButtonLink href="/center/find" className="mt-5">
              {t.gym.chooseGym}
            </ButtonLink>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">{t.pro.title}</h2>
        <p className="mt-1 text-base text-muted">{t.pro.homeCard}</p>
        <ButtonLink href="/pro" variant="secondary" className="mt-5">
          {t.pro.homeButton}
        </ButtonLink>
      </Card>


      <Card>
        <h2 className="text-lg font-bold">{t.home.catalogCard}</h2>
        <p className="mt-1 text-base text-muted">
          {t.home.catalogCount(machineTypes.count ?? 0, exercises.count ?? 0)}
        </p>
        <ButtonLink href="/katalog" variant="secondary" className="mt-5">
          {t.home.seeCatalog}
        </ButtonLink>
      </Card>
    </main>
  );
}
