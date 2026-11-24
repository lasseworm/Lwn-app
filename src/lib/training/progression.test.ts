import { describe, expect, it } from "vitest";
import {
  evaluate,
  prescribe,
  PROGRESSION_CONFIG,
  stepWeight,
  warmupSets,
  type PerformedSet,
  type ProgressState,
} from "./progression";

const plan = { sets: 3, repMin: 8, repMax: 12 };
const stack = { weight_step_kg: 7, extra_plate_kg: null, min_weight_kg: 7, max_weight_kg: 49 };
const NOW = new Date("2026-11-25T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

const state = (s: Partial<ProgressState>): ProgressState => ({
  current_weight_kg: null,
  current_reps: null,
  current_sets: null,
  last_successful_weight_kg: null,
  last_successful_reps: null,
  last_successful_sets: null,
  hold_level: false,
  baseline_weight_kg: null,
  last_performed_at: daysAgo(3),
  ...s,
});

const sets = (n: number, weight: number | null, reps: number, completed = true): PerformedSet[] =>
  Array.from({ length: n }, () => ({ weight, reps, completed }));

describe("prescribe", () => {
  it("første gang: vælg startvægt, rep_min og planens sæt", () => {
    const p = prescribe(null, plan, "weighted", stack, NOW);
    expect(p).toMatchObject({ weight: null, reps: 8, sets: 3, needsStartWeight: true, pause: null });
  });

  it("kropsvægt kræver ikke startvægt", () => {
    expect(prescribe(null, plan, "bodyweight", null, NOW).needsStartWeight).toBe(false);
  });

  it("bruger nuværende niveau", () => {
    const p = prescribe(state({ current_weight_kg: 21, current_reps: 10 }), plan, "weighted", stack, NOW);
    expect(p).toMatchObject({ weight: 21, reps: 10, needsStartWeight: false, fromHold: false });
  });

  it("hold_level: bruger sidste vellykkede niveau uændret", () => {
    const s = state({ current_weight_kg: 28, current_reps: 8, last_successful_weight_kg: 21, last_successful_reps: 12, hold_level: true });
    expect(prescribe(s, plan, "weighted", stack, NOW)).toMatchObject({ weight: 21, reps: 12, fromHold: true });
  });

  it("holder reps inden for planens interval, hvis programmet er ændret", () => {
    const p = prescribe(state({ current_weight_kg: 21, current_reps: 15 }), plan, "weighted", stack, NOW);
    expect(p.reps).toBe(12);
  });

  it("pause under grænsen: ingen forslag", () => {
    const s = state({ current_weight_kg: 28, current_reps: 9, last_performed_at: daysAgo(PROGRESSION_CONFIG.pauseDays) });
    expect(prescribe(s, plan, "weighted", stack, NOW).pause).toBeNull();
  });

  it("pause over grænsen: foreslår lettere, gyldig vægt", () => {
    const s = state({ current_weight_kg: 35, current_reps: 9, last_performed_at: daysAgo(30) });
    const p = prescribe(s, plan, "weighted", stack, NOW);
    expect(p.pause?.days).toBe(30);
    expect(p.pause?.suggestedWeight).toBe(28); // 90 % af 35 = 31,5 → nærmeste trin 28 (lettere)
    expect(p.weight).toBe(35); // brugeren vælger selv – intet ændres automatisk
  });

  it("pause på laveste vægt: intet lettere forslag", () => {
    const s = state({ current_weight_kg: 7, current_reps: 9, last_performed_at: daysAgo(30) });
    expect(prescribe(s, plan, "weighted", stack, NOW).pause?.suggestedWeight).toBeNull();
  });
});

describe("evaluate – dobbelt progression", () => {
  it("første pas: startvægt bliver baseline og +1 rep", () => {
    const p = prescribe(null, plan, "weighted", stack, NOW);
    const next = evaluate(null, p, plan, "weighted", stack, sets(3, 21, 8));
    expect(next).toMatchObject({ baseline_weight_kg: 21, current_weight_kg: 21, current_reps: 9, last_successful_reps: 8 });
  });

  it("alle sæt nået: +1 rep", () => {
    const s = state({ current_weight_kg: 21, current_reps: 9 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 9));
    expect(next).toMatchObject({ current_weight_kg: 21, current_reps: 10, last_successful_weight_kg: 21, last_successful_reps: 9 });
  });

  it("flere reps end målet: progression fra det opnåede", () => {
    const s = state({ current_weight_kg: 21, current_reps: 9 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 11));
    expect(next?.current_reps).toBe(12);
  });

  it("rep_max i alle sæt: næste vægttrin og reps til rep_min", () => {
    const s = state({ current_weight_kg: 21, current_reps: 12 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 12));
    expect(next).toMatchObject({ current_weight_kg: 28, current_reps: 8 });
  });

  it("vægttrin med mellemplade: næste trin er mellempladen", () => {
    const withExtra = { ...stack, extra_plate_kg: 3.5 };
    const s = state({ current_weight_kg: 21, current_reps: 12 });
    const next = evaluate(s, prescribe(s, plan, "weighted", withExtra, NOW), plan, "weighted", withExtra, sets(3, 21, 12));
    expect(next?.current_weight_kg).toBe(24.5);
  });

  it("øverste plade nået: bliver på max uden fejl", () => {
    const s = state({ current_weight_kg: 49, current_reps: 12 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 49, 12));
    expect(next).toMatchObject({ current_weight_kg: 49, current_reps: 12 });
  });

  it("maskine uden vægttrin: bruger fallback-trin", () => {
    const s = state({ current_weight_kg: 20, current_reps: 12 });
    const next = evaluate(s, prescribe(s, plan, "weighted", null, NOW), plan, "weighted", null, sets(3, 20, 12));
    expect(next?.current_weight_kg).toBe(20 + PROGRESSION_CONFIG.fallbackStepKg);
  });

  it("et sæt under målet: samme mål igen – ingen nedsættelse", () => {
    const s = state({ current_weight_kg: 21, current_reps: 10, last_successful_weight_kg: 21, last_successful_reps: 9 });
    const performed = [...sets(2, 21, 10), { weight: 21, reps: 7, completed: true }];
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, performed);
    expect(next).toMatchObject({ current_weight_kg: 21, current_reps: 10, last_successful_reps: 9 });
  });

  it("færre sæt end planlagt: ingen progression", () => {
    const s = state({ current_weight_kg: 21, current_reps: 10 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(2, 21, 10));
    expect(next).toMatchObject({ current_weight_kg: 21, current_reps: 10 });
  });

  it("lettere vægt end målet: ingen progression og ingen nedsættelse", () => {
    const s = state({ current_weight_kg: 28, current_reps: 10 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 12));
    expect(next).toMatchObject({ current_weight_kg: 28, current_reps: 10 });
  });

  it("tungere vægt end målet med alle reps: progression fra den nye vægt", () => {
    const s = state({ current_weight_kg: 21, current_reps: 10 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 28, 10));
    expect(next).toMatchObject({ current_weight_kg: 28, current_reps: 11, last_successful_weight_kg: 28 });
  });

  it("intet fuldført sæt: ingen ændring (øvelsen sprunget over)", () => {
    const s = state({ current_weight_kg: 21, current_reps: 10 });
    expect(evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 10, false))).toBeNull();
  });

  it("kropsvægt: kun reps stiger, og stopper ved rep_max", () => {
    const s = state({ current_reps: 11 });
    const p = prescribe(s, plan, "bodyweight", null, NOW);
    expect(evaluate(s, p, plan, "bodyweight", null, sets(3, null, 11))).toMatchObject({ current_reps: 12, current_weight_kg: null });
    const s2 = state({ current_reps: 12 });
    expect(evaluate(s2, prescribe(s2, plan, "bodyweight", null, NOW), plan, "bodyweight", null, sets(3, null, 12))?.current_reps).toBe(12);
  });
});

describe("evaluate – Progression virkede ikke (hold_level)", () => {
  it("trykket: hold_level slås til, og intet andet ændres", () => {
    const s = state({ current_weight_kg: 28, current_reps: 8, last_successful_weight_kg: 21, last_successful_reps: 12, last_successful_sets: 3 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 28, 6), { progressionDidNotWork: true });
    expect(next).toMatchObject({ hold_level: true, current_weight_kg: 28, last_successful_weight_kg: 21, last_successful_reps: 12 });
  });

  it("næste gang gentages sidste vellykkede niveau, og når det lykkes, nulstilles hold_level", () => {
    const s = state({ current_weight_kg: 28, current_reps: 8, last_successful_weight_kg: 21, last_successful_reps: 12, hold_level: true });
    const p = prescribe(s, plan, "weighted", stack, NOW);
    expect(p).toMatchObject({ weight: 21, reps: 12, fromHold: true });
    const next = evaluate(s, p, plan, "weighted", stack, sets(3, 21, 12));
    expect(next).toMatchObject({ hold_level: false, current_weight_kg: 28, current_reps: 8 });
  });

  it("hold-niveau mislykkes: hold_level bevares – ingen nulstilling eller nedsættelse", () => {
    const s = state({ current_weight_kg: 28, current_reps: 8, last_successful_weight_kg: 21, last_successful_reps: 12, hold_level: true });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 10));
    expect(next).toMatchObject({ hold_level: true, current_weight_kg: 28, last_successful_weight_kg: 21 });
  });

  it("trykket uden tidligere vellykket niveau: nuværende mål bliver niveauet", () => {
    const s = state({ current_weight_kg: 21, current_reps: 9 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, [], { progressionDidNotWork: true });
    expect(next).toMatchObject({ hold_level: true, last_successful_weight_kg: 21, last_successful_reps: 9 });
  });
});

describe("evaluate – smerte", () => {
  it("ingen progression ved smerte", () => {
    const s = state({ current_weight_kg: 21, current_reps: 12 });
    const next = evaluate(s, prescribe(s, plan, "weighted", stack, NOW), plan, "weighted", stack, sets(3, 21, 12), { pain: true });
    expect(next).toMatchObject({ current_weight_kg: 21, current_reps: 12 });
  });

  it("smerte første gang: startvægten huskes som baseline", () => {
    const p = prescribe(null, plan, "weighted", stack, NOW);
    const next = evaluate(null, p, plan, "weighted", stack, sets(1, 14, 8), { pain: true });
    expect(next).toMatchObject({ baseline_weight_kg: 14, current_weight_kg: 14 });
  });
});

describe("hjælpere", () => {
  it("opvarmning: lettere gyldige vægte", () => {
    expect(warmupSets(35, stack)).toEqual([
      { weight: 14, reps: 10 },
      { weight: 28, reps: 5 },
    ]);
    expect(warmupSets(7, stack)).toEqual([]);
    expect(warmupSets(null, stack)).toEqual([]);
  });

  it("stepWeight følger gyldige trin og stopper i enderne", () => {
    expect(stepWeight(21, 1, stack)).toBe(28);
    expect(stepWeight(21, -1, stack)).toBe(14);
    expect(stepWeight(7, -1, stack)).toBe(7);
    expect(stepWeight(49, 1, stack)).toBe(49);
    expect(stepWeight(null, 1, stack)).toBe(7);
    expect(stepWeight(20, 1, stack)).toBe(21); // ugyldig vægt → næste gyldige
  });
});
