import { describe, expect, it } from "vitest";
import {
  exerciseSeries,
  percentChange,
  periodRanges,
  records,
  recordsInRange,
  shouldOfferProgramReview,
  summarize,
  type SetRow,
  type WorkoutRow,
} from "./stats";

const NOW = new Date("2026-11-25T12:00:00Z");
const ago = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

const set = (workout_id: string, exercise_id: string, weight_kg: number | null, reps: number, extra: Partial<SetRow> = {}): SetRow => ({
  workout_id,
  exercise_id,
  weight_kg,
  reps,
  completed: true,
  is_warmup: false,
  ...extra,
});

const workouts: WorkoutRow[] = [
  { id: "w1", finished_at: ago(20) },
  { id: "w2", finished_at: ago(10) },
  { id: "w3", finished_at: ago(5) },
  { id: "w4", finished_at: ago(2) },
];

const sets: SetRow[] = [
  set("w1", "press", 20, 10),
  set("w1", "press", 20, 10),
  set("w2", "press", 20, 12),
  set("w3", "press", 25, 8),
  set("w3", "press", 25, 8),
  set("w3", "press", 10, 10, { is_warmup: true }), // opvarmning tæller ikke
  set("w4", "press", 25, 9),
  set("w4", "press", 0, 0, { completed: false }), // ikke fuldført
  set("w4", "plank", null, 30),
  set("w4", "plank", null, 40),
];

describe("periodRanges", () => {
  it("giver lige lange, tilstødende perioder", () => {
    const { current, previous } = periodRanges("week", NOW);
    expect(current.to).toEqual(NOW);
    expect(current.from.getTime() - previous.from.getTime()).toBe(7 * 86_400_000);
    expect(previous.to).toEqual(current.from);
  });
});

describe("summarize", () => {
  it("tæller pas, arbejdssæt og volumen i perioden", () => {
    const { current, previous } = periodRanges("week", NOW);
    expect(summarize(workouts, sets, current, null)).toEqual({ sessions: 2, sets: 5, volumeKg: 25 * 8 * 2 + 25 * 9, regularity: null });
    expect(summarize(workouts, sets, previous, null)).toMatchObject({ sessions: 1, sets: 1, volumeKg: 240 });
  });

  it("regelmæssighed: gennemførte pas / planlagte", () => {
    const { current } = periodRanges("month", NOW);
    // 3 pas/uge i 30 dage ≈ 12,9 planlagt; 4 gennemført
    expect(summarize(workouts, sets, current, 3).regularity).toBeCloseTo(4 / ((3 * 30) / 7), 5);
  });

  it("regelmæssighed tæller kun fra programmets start og loftes ved 100 %", () => {
    const { current } = periodRanges("month", NOW);
    const r = summarize(workouts, sets, current, 2, new Date(ago(14)));
    expect(r.regularity).toBe(1); // 4 pas på 2 uger med 2/uge → over 100 % → 1
  });

  it("intet planlagt endnu: ingen regelmæssighed", () => {
    const { current } = periodRanges("week", NOW);
    expect(summarize(workouts, sets, current, 3, new Date(ago(1))).regularity).toBeNull();
  });
});

describe("percentChange", () => {
  it("beregner ændring og håndterer nul", () => {
    expect(percentChange(12, 10)).toBe(20);
    expect(percentChange(5, 10)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(3, 0)).toBeNull();
  });
});

describe("records", () => {
  const recs = records(workouts, sets);
  const press = recs.find((r) => r.exercise_id === "press")!;
  const plank = recs.find((r) => r.exercise_id === "plank")!;

  it("tungeste vægt med flest reps ved den vægt, dateret første gang", () => {
    expect(press.heaviest).toEqual({ weight: 25, reps: 9, date: ago(2) });
  });

  it("flest reps i ét sæt", () => {
    expect(press.mostReps).toEqual({ reps: 12, weight: 20, date: ago(10) });
  });

  it("kropsvægt: kun reps", () => {
    expect(plank.heaviest).toBeNull();
    expect(plank.mostReps?.reps).toBe(40);
  });

  it("nye rekorder i perioden", () => {
    const { current } = periodRanges("week", NOW);
    expect(recordsInRange(recs, current).map((r) => r.exercise_id).sort()).toEqual(["plank", "press"]);
  });
});

describe("exerciseSeries", () => {
  it("ét punkt pr. pas med tungeste arbejdssæt, sorteret efter dato", () => {
    expect(exerciseSeries(workouts, sets, "press")).toEqual([
      { date: ago(20), weight: 20, reps: 10 },
      { date: ago(10), weight: 20, reps: 12 },
      { date: ago(5), weight: 25, reps: 8 },
      { date: ago(2), weight: 25, reps: 9 },
    ]);
  });
});

describe("shouldOfferProgramReview (12 uger)", () => {
  const base = { programGeneratedAt: ago(90), sessionsPerWeek: 3, finishedSinceProgram: 22, snoozedUntil: null, now: NOW };
  it("tilbydes efter 12 uger med mindst 60 % af pas", () => {
    expect(shouldOfferProgramReview(base)).toBe(true); // 60 % af 36 = 21,6
  });
  it("ikke før 12 uger", () => {
    expect(shouldOfferProgramReview({ ...base, programGeneratedAt: ago(80) })).toBe(false);
  });
  it("ikke ved for lidt regelmæssighed", () => {
    expect(shouldOfferProgramReview({ ...base, finishedSinceProgram: 21 })).toBe(false);
  });
  it("ikke mens spørgsmålet er udsat", () => {
    expect(shouldOfferProgramReview({ ...base, snoozedUntil: ago(-7) })).toBe(false);
    expect(shouldOfferProgramReview({ ...base, snoozedUntil: ago(1) })).toBe(true);
  });
});
