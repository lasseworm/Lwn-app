/**
 * Vægttrin for en maskine.
 * Gyldige vægte er min + n × step (n = 0, 1, 2 …) op til max.
 * Har maskinen en ekstra mellemplade (fx 3,5 kg på en 7 kg-stak), kan den lægges oven i
 * hvert trin, så man også kan vælge min + n × step + extra.
 */
export type WeightSettings = {
  weight_step_kg: number | null;
  extra_plate_kg?: number | null;
  min_weight_kg?: number | null;
  max_weight_kg?: number | null;
};

/** Afrunder til 2 decimaler for at undgå flydende-komma-støj (fx 3,5 × 3 = 10,499999…). */
export function roundKg(n: number) {
  return Math.round(n * 100) / 100;
}

/** Alle gyldige vægte, sorteret stigende og uden dubletter. Tom liste hvis trin mangler. */
export function validWeights(s: WeightSettings): number[] {
  const step = s.weight_step_kg ?? 0;
  if (!(step > 0)) return [];
  const min = Math.max(0, s.min_weight_kg ?? step);
  // Uden max lægges et rimeligt loft (40 trin), så listen ikke bliver uendelig.
  const max = s.max_weight_kg != null && s.max_weight_kg >= min ? s.max_weight_kg : min + step * 40;
  const extra = s.extra_plate_kg != null && s.extra_plate_kg > 0 ? s.extra_plate_kg : 0;

  const out = new Set<number>();
  const steps = Math.floor(roundKg((max - min) / step));
  for (let n = 0; n <= steps; n++) {
    const w = roundKg(min + n * step);
    out.add(w);
    // Mellempladen kan bruges på alle trin – også oven på den tungeste plade.
    if (extra) out.add(roundKg(w + extra));
  }
  return [...out].sort((a, b) => a - b);
}

/** Nærmeste gyldige vægt (ved lige afstand vælges den lettere). */
export function nearestValidWeight(target: number, s: WeightSettings): number | null {
  const list = validWeights(s);
  if (list.length === 0) return null;
  let best = list[0];
  for (const w of list) {
    if (Math.abs(w - target) < Math.abs(best - target)) best = w;
  }
  return best;
}

/** Næste gyldige vægt over den nuværende (bruges af progression i Trin 3). */
export function nextValidWeight(current: number, s: WeightSettings): number | null {
  return validWeights(s).find((w) => w > roundKg(current)) ?? null;
}

/** Validering af brugerens indtastning. Returnerer en dansk fejltekst eller null. */
export function validateWeightSettings(s: WeightSettings): string | null {
  const { weight_step_kg: step, extra_plate_kg: extra, min_weight_kg: min, max_weight_kg: max } = s;
  if (step == null) return null; // vægttrin er valgfrit (fx bænk, måtte)
  if (!(step > 0) || step > 50) return "Vægttrin skal være mellem 0 og 50 kg.";
  if (extra != null && (extra <= 0 || extra >= step)) return "Mellempladen skal være mindre end vægttrinnet.";
  if (min != null && (min < 0 || min > 500)) return "Laveste vægt skal være mellem 0 og 500 kg.";
  if (max != null && (max <= 0 || max > 1000)) return "Højeste vægt skal være mellem 0 og 1000 kg.";
  if (min != null && max != null && max < min) return "Højeste vægt skal være større end laveste vægt.";
  return null;
}
