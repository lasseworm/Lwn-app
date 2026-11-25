/**
 * Fremgang: nøgletal pr. periode med sammenligning, rekorder og serier pr. øvelse.
 * Rent modul (ingen database), så beregningerne kan testes.
 *
 * Perioder er glidende vinduer (seneste 7/30/182/365 dage) sammenlignet med
 * lige så lang en periode umiddelbart før. Så er sammenligningen altid fair,
 * også midt i en uge eller måned.
 */

export type PeriodKey = "week" | "month" | "half" | "year";

export const PERIOD_DAYS: Record<PeriodKey, number> = { week: 7, month: 30, half: 182, year: 365 };

export type WorkoutRow = { id: string; finished_at: string };

export type SetRow = {
  workout_id: string;
  exercise_id: string;
  weight_kg: number | null;
  reps: number;
  completed: boolean;
  is_warmup: boolean;
};

export type Range = { from: Date; to: Date };

const DAY = 86_400_000;

export function periodRanges(period: PeriodKey, now: Date): { current: Range; previous: Range } {
  const days = PERIOD_DAYS[period];
  const to = now;
  const from = new Date(now.getTime() - days * DAY);
  return { current: { from, to }, previous: { from: new Date(from.getTime() - days * DAY), to: from } };
}

const inRange = (iso: string, r: Range) => {
  const t = new Date(iso).getTime();
  return t > r.from.getTime() && t <= r.to.getTime();
};

/** Kun rigtige arbejdssæt tæller (ikke opvarmning, ikke smerte-markører) */
const isWorkSet = (s: SetRow) => s.completed && !s.is_warmup && s.reps > 0;

export type Summary = {
  sessions: number;
  sets: number;
  /** Samlet løftet vægt (kg × reps) – kropsvægtssæt tæller 0 */
  volumeKg: number;
  /** Andel af planlagte pas gennemført (0–1), eller null hvis intet er planlagt */
  regularity: number | null;
};

export function summarize(
  workouts: WorkoutRow[],
  sets: SetRow[],
  range: Range,
  sessionsPerWeek: number | null,
  /** Programmet startede: dage før dette tæller ikke som "planlagt" */
  plannedSince?: Date | null,
): Summary {
  const ids = new Set(workouts.filter((w) => inRange(w.finished_at, range)).map((w) => w.id));
  const work = sets.filter((s) => ids.has(s.workout_id) && isWorkSet(s));
  const volumeKg = Math.round(work.reduce((sum, s) => sum + (s.weight_kg ?? 0) * s.reps, 0));

  let regularity: number | null = null;
  if (sessionsPerWeek && sessionsPerWeek > 0) {
    const start = plannedSince && plannedSince > range.from ? plannedSince : range.from;
    const days = Math.max(0, (range.to.getTime() - start.getTime()) / DAY);
    const planned = (sessionsPerWeek * days) / 7;
    regularity = planned >= 1 ? Math.min(1, ids.size / planned) : null;
  }
  return { sessions: ids.size, sets: work.length, volumeKg, regularity };
}

/** Ændring i procent (afrundet); null hvis der intet var at sammenligne med */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export type ExerciseRecord = {
  exercise_id: string;
  /** Tungeste vægt i et fuldført sæt, og flest reps med netop den vægt */
  heaviest: { weight: number; reps: number; date: string } | null;
  /** Flest reps i ét sæt (uanset vægt) – det eneste for kropsvægt */
  mostReps: { reps: number; weight: number | null; date: string } | null;
};

export function records(workouts: WorkoutRow[], sets: SetRow[]): ExerciseRecord[] {
  const dateOf = new Map(workouts.map((w) => [w.id, w.finished_at]));
  const byExercise = new Map<string, ExerciseRecord>();
  // Ældste først, så en rekord tilskrives første gang den blev sat
  const ordered = sets
    .filter((s) => isWorkSet(s) && dateOf.has(s.workout_id))
    .sort((a, b) => dateOf.get(a.workout_id)!.localeCompare(dateOf.get(b.workout_id)!));
  for (const s of ordered) {
    const date = dateOf.get(s.workout_id)!;
    const r = byExercise.get(s.exercise_id) ?? { exercise_id: s.exercise_id, heaviest: null, mostReps: null };
    if (s.weight_kg != null && s.weight_kg > 0) {
      if (!r.heaviest || s.weight_kg > r.heaviest.weight || (s.weight_kg === r.heaviest.weight && s.reps > r.heaviest.reps)) {
        r.heaviest = { weight: s.weight_kg, reps: s.reps, date };
      }
    }
    if (!r.mostReps || s.reps > r.mostReps.reps) r.mostReps = { reps: s.reps, weight: s.weight_kg, date };
    byExercise.set(s.exercise_id, r);
  }
  return [...byExercise.values()];
}

/** Rekorder sat inden for perioden (til "nye rekorder") */
export function recordsInRange(recs: ExerciseRecord[], range: Range) {
  return recs.filter((r) => (r.heaviest && inRange(r.heaviest.date, range)) || (r.mostReps && inRange(r.mostReps.date, range)));
}

export type SeriesPoint = { date: string; weight: number | null; reps: number };

/** Én værdi pr. pas: tungeste fuldførte arbejdssæt (og dets reps) */
export function exerciseSeries(workouts: WorkoutRow[], sets: SetRow[], exerciseId: string): SeriesPoint[] {
  const dateOf = new Map(workouts.map((w) => [w.id, w.finished_at]));
  const best = new Map<string, SeriesPoint>();
  for (const s of sets) {
    if (s.exercise_id !== exerciseId || !isWorkSet(s) || !dateOf.has(s.workout_id)) continue;
    const cur = best.get(s.workout_id);
    const w = s.weight_kg ?? null;
    if (!cur || (w ?? 0) > (cur.weight ?? 0) || ((w ?? 0) === (cur.weight ?? 0) && s.reps > cur.reps)) {
      best.set(s.workout_id, { date: dateOf.get(s.workout_id)!, weight: w, reps: s.reps });
    }
  }
  return [...best.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** 12-ugers-spørgsmålet (byggeplan 3.5): mindst 12 uger og mindst 60 % af planlagte pas */
export const REVIEW_CONFIG = { weeks: 12, minShare: 0.6 };

export function shouldOfferProgramReview(input: {
  programGeneratedAt: string | null;
  sessionsPerWeek: number | null;
  finishedSinceProgram: number;
  snoozedUntil: string | null;
  now: Date;
}): boolean {
  const { programGeneratedAt, sessionsPerWeek, finishedSinceProgram, snoozedUntil, now } = input;
  if (!programGeneratedAt || !sessionsPerWeek) return false;
  if (snoozedUntil && new Date(snoozedUntil) > now) return false;
  const weeks = (now.getTime() - new Date(programGeneratedAt).getTime()) / (7 * DAY);
  if (weeks < REVIEW_CONFIG.weeks) return false;
  return finishedSinceProgram >= REVIEW_CONFIG.minShare * sessionsPerWeek * REVIEW_CONFIG.weeks;
}
