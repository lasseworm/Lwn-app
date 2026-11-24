/**
 * Dobbelt progression pr. øvelse (LWN-byggeplan afsnit 3.2).
 *
 * - Alle sæt nået med rep_max → næste gyldige vægttrin, reps tilbage til rep_min.
 * - Ellers, når alle sæt når målet → +1 rep næste gang.
 * - Mislykket pas → samme mål igen. Aldrig automatisk nedsættelse eller nulstilling.
 * - "Progression virkede ikke" → næste gang bruges sidste vellykkede niveau uændret (hold_level).
 *   Når det niveau gennemføres, nulstilles hold_level, og progressionen fortsætter derfra.
 * - Progression sker kun ved gennemførte pas – aldrig pga. kalenderen.
 * - Pause over PAUSE_DAYS dage → forslag om lettere start (brugeren vælger).
 * - Smerte → ingen progression; øvelsen stoppes.
 *
 * Modulet er rent (ingen database), så alle grænsetilfælde kan testes.
 */
import { nearestValidWeight, nextValidWeight, roundKg, validWeights, type WeightSettings } from "@/lib/equipment/weights";

/** Konfigurerbare tærskler */
export const PROGRESSION_CONFIG = {
  /** Pause længere end dette (dage) giver forslag om lettere start */
  pauseDays: 14,
  /** Forslag efter pause: ca. 90 % af sidste vægt */
  pauseFactor: 0.9,
  /** Bruges når en maskine ikke har vægttrin registreret */
  fallbackStepKg: 2.5,
};

/**
 * weighted   – almindelig vægt: progression = mere vægt
 * bodyweight – kropsvægt: kun reps
 * assisted   – assisteret maskine (fx pull-up): vægten er HJÆLP, så progression = mindre vægt
 */
export type LoadType = "weighted" | "bodyweight" | "assisted";

export type PlanTarget = { sets: number; repMin: number; repMax: number };

export type ProgressState = {
  current_weight_kg: number | null;
  current_reps: number | null;
  current_sets: number | null;
  last_successful_weight_kg: number | null;
  last_successful_reps: number | null;
  last_successful_sets: number | null;
  hold_level: boolean | null;
  baseline_weight_kg: number | null;
  last_performed_at: string | null;
};

export type Prescription = {
  weight: number | null; // null = vælg startvægt (vægtet) eller kropsvægt
  reps: number;
  sets: number;
  needsStartWeight: boolean;
  fromHold: boolean;
  pause: { days: number; suggestedWeight: number | null } | null;
};

export type PerformedSet = { weight: number | null; reps: number; completed: boolean };

export type SessionOutcome = {
  pain?: boolean;
  /** Brugeren trykkede "Progression virkede ikke" for øvelsen i dette pas */
  progressionDidNotWork?: boolean;
};

/** Den state der gemmes efter passet (uden last_performed_at, som databasen sætter) */
export type NextState = Omit<ProgressState, "last_performed_at">;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Vægttrin med fallback, så progression altid har et næste trin at gå til */
export function effectiveSettings(s: WeightSettings | null | undefined): WeightSettings {
  return {
    weight_step_kg: s?.weight_step_kg && s.weight_step_kg > 0 ? s.weight_step_kg : PROGRESSION_CONFIG.fallbackStepKg,
    extra_plate_kg: s?.extra_plate_kg ?? null,
    min_weight_kg: s?.min_weight_kg ?? null,
    max_weight_kg: s?.max_weight_kg ?? null,
  };
}

export function daysBetween(fromIso: string, now: Date) {
  return Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

/** Hvad skal brugeren lave i dag? */
export function prescribe(
  state: ProgressState | null,
  plan: PlanTarget,
  load: LoadType,
  settings: WeightSettings | null,
  now: Date = new Date(),
): Prescription {
  const sets = plan.sets;
  const base = { sets, fromHold: false, pause: null as Prescription["pause"] };

  if (!state || (load !== "bodyweight" && state.current_weight_kg == null)) {
    return { ...base, weight: null, reps: plan.repMin, needsStartWeight: load !== "bodyweight" };
  }

  const useHold = !!state.hold_level && state.last_successful_reps != null;
  const weight = load === "bodyweight" ? null : useHold ? state.last_successful_weight_kg : state.current_weight_kg;
  const rawReps = (useHold ? state.last_successful_reps : state.current_reps) ?? plan.repMin;
  const reps = clamp(rawReps, plan.repMin, plan.repMax);

  let pause: Prescription["pause"] = null;
  if (state.last_performed_at) {
    const days = daysBetween(state.last_performed_at, now);
    if (days > PROGRESSION_CONFIG.pauseDays) {
      let suggestedWeight: number | null = null;
      if (weight != null && load === "assisted") {
        // Assisteret: lettere start = mere hjælp = ét trin mere vægt
        const up = nextValidWeight(weight, effectiveSettings(settings));
        suggestedWeight = up;
      } else if (weight != null) {
        const eff = effectiveSettings(settings);
        suggestedWeight = nearestValidWeight(weight * PROGRESSION_CONFIG.pauseFactor, eff);
        // Forslaget skal være lettere end før; ellers ét trin ned, hvis muligt
        if (suggestedWeight != null && suggestedWeight >= weight) {
          const lower = validWeights(eff).filter((w) => w < weight);
          suggestedWeight = lower.length ? lower[lower.length - 1] : null;
        }
      }
      pause = { days, suggestedWeight };
    }
  }

  return { ...base, weight, reps, needsStartWeight: false, fromHold: useHold, pause };
}

/**
 * Beregn ny state efter et gennemført pas.
 * Returnerer null, hvis øvelsen slet ikke blev udført (ingen fuldførte sæt) – så ændres intet.
 */
export function evaluate(
  state: ProgressState | null,
  prescribed: Prescription,
  plan: PlanTarget,
  load: LoadType,
  settings: WeightSettings | null,
  performed: PerformedSet[],
  outcome: SessionOutcome = {},
): NextState | null {
  const done = performed.filter((s) => s.completed && s.reps > 0);
  if (done.length === 0 && !outcome.progressionDidNotWork) return null;
  // "Progression virkede ikke" uden noget niveau at gentage (aldrig udført): intet at gemme
  const hasLevel = state != null && (load === "bodyweight" ? state.current_reps != null : state.current_weight_kg != null);
  if (outcome.progressionDidNotWork && !hasLevel && done.length === 0) return null;

  const prev: NextState = {
    current_weight_kg: state?.current_weight_kg ?? null,
    current_reps: state?.current_reps ?? null,
    current_sets: state?.current_sets ?? null,
    last_successful_weight_kg: state?.last_successful_weight_kg ?? null,
    last_successful_reps: state?.last_successful_reps ?? null,
    last_successful_sets: state?.last_successful_sets ?? null,
    hold_level: state?.hold_level ?? false,
    baseline_weight_kg: state?.baseline_weight_kg ?? null,
  };

  // Laveste vægt brugt i et fuldført sæt (konservativt)
  const weights = done.map((s) => s.weight).filter((w): w is number => w != null);
  // Konservativt: laveste vægt – men for assisteret er MEST hjælp det letteste
  const usedWeight =
    load === "bodyweight" || weights.length === 0
      ? null
      : roundKg(load === "assisted" ? Math.max(...weights) : Math.min(...weights));
  const minReps = done.length ? Math.min(...done.map((s) => s.reps)) : 0;

  // Første gang: startvægten bliver baseline og nuværende niveau
  if (load !== "bodyweight" && prev.baseline_weight_kg == null && usedWeight != null) {
    prev.baseline_weight_kg = usedWeight;
  }
  if (prev.current_weight_kg == null && load !== "bodyweight") prev.current_weight_kg = usedWeight;
  if (prev.current_reps == null) prev.current_reps = prescribed.reps;
  if (prev.current_sets == null) prev.current_sets = plan.sets;

  // Smerte: ingen progression – men startvægten huskes, hvis det var første gang
  if (outcome.pain) return prev;

  // "Progression virkede ikke": næste gang gentages sidste vellykkede niveau
  if (outcome.progressionDidNotWork) {
    if (prev.last_successful_reps == null) {
      // Intet vellykket niveau endnu: brug det nuværende mål som niveau at gentage
      prev.last_successful_weight_kg = prev.current_weight_kg;
      prev.last_successful_reps = prev.current_reps;
      prev.last_successful_sets = prev.current_sets;
    }
    return { ...prev, hold_level: true };
  }

  const targetWeight = prescribed.weight;
  const allSets = done.length >= prescribed.sets;
  const repsOk = minReps >= prescribed.reps;
  const weightOk =
    load === "bodyweight" ||
    targetWeight == null ||
    (usedWeight != null &&
      (load === "assisted" ? usedWeight <= roundKg(targetWeight) : usedWeight >= roundKg(targetWeight)));
  const success = allSets && repsOk && weightOk;

  if (!success) {
    // Lettere end målet eller færre reps/sæt: samme mål igen. Ingen automatisk nedsættelse.
    return prev;
  }

  const levelWeight = load === "bodyweight" ? null : usedWeight;
  const next: NextState = {
    ...prev,
    last_successful_weight_kg: levelWeight,
    last_successful_reps: minReps,
    last_successful_sets: done.length,
    hold_level: false,
    current_sets: plan.sets,
  };

  if (minReps >= plan.repMax) {
    if (load === "bodyweight" || levelWeight == null) {
      next.current_weight_kg = null;
      next.current_reps = plan.repMax; // kropsvægt: bliv på toppen (sværere variant kommer senere)
    } else {
      const eff = effectiveSettings(settings);
      const nextW =
        load === "assisted"
          ? (validWeights(eff).filter((w) => w < levelWeight - 1e-9).at(-1) ?? null) // mindre hjælp
          : nextValidWeight(levelWeight, eff);
      if (nextW != null) {
        next.current_weight_kg = nextW;
        next.current_reps = plan.repMin;
      } else {
        // Øverste plade (eller mindste hjælp) nået: bliv dér
        next.current_weight_kg = levelWeight;
        next.current_reps = plan.repMax;
      }
    }
  } else {
    next.current_weight_kg = levelWeight;
    next.current_reps = clamp(minReps + 1, plan.repMin, plan.repMax);
  }
  return next;
}

/** Opvarmningssæt: ca. 50 % og 75 % af arbejdsvægten, på gyldige trin og lettere end arbejdsvægten */
export function warmupSets(workWeight: number | null, settings: WeightSettings | null): { weight: number; reps: number }[] {
  if (workWeight == null || workWeight <= 0) return [];
  const eff = effectiveSettings(settings);
  const out: { weight: number; reps: number }[] = [];
  for (const [factor, reps] of [
    [0.5, 10],
    [0.75, 5],
  ] as const) {
    const w = nearestValidWeight(workWeight * factor, eff);
    if (w != null && w < workWeight && !out.some((o) => o.weight === w)) out.push({ weight: w, reps });
  }
  return out;
}

/** Vægttrin op/ned fra en given vægt (til +/- knapperne på træningsskærmen) */
export function stepWeight(current: number | null, dir: 1 | -1, settings: WeightSettings | null): number | null {
  const list = validWeights(effectiveSettings(settings));
  if (!list.length) return current;
  if (current == null) return list[0];
  if (dir === 1) return list.find((w) => w > current + 1e-9) ?? current;
  const lower = list.filter((w) => w < current - 1e-9);
  return lower.length ? lower[lower.length - 1] : current;
}
