/**
 * Programgenerator (LWN-byggeplan afsnit 3.1).
 *
 * - 2 pas/uge: fuld krop A/B · 3 pas: fuld krop A/B/C · 4 pas: overkrop/underkrop × 2
 * - Dækker bryst, ryg, skuldre, ben (forlår, baglår, baller), arme og mave/core
 * - Balancerer push/pull og over-/underkrop via faste "slots" pr. bevægelsesmønster
 * - Maskiner først. Frie vægte kun når et mønster ellers ikke kan dækkes
 * - Øvelser springes over, hvis udstyret mangler – intet tvinges ind
 * - Multifunktionsudstyr (kabel, Smith, håndvægte …) bidrager via øvelseskataloget
 * - Brugerens udeladelser og foretrukne alternativer respekteres
 *
 * Volumen og rep-intervaller kommer fra katalogets standardværdier (nybegynder: 2–3 sæt × 8–15).
 * Referencer: docs/evidens.md
 *
 * Modulet er rent (ingen database), så det kan testes med forskellige udstyrslister.
 */

export type Experience = "beginner" | "returning" | "intermediate";

/** Hvordan vægten skal forstås for progression */
export function loadTypeFor(machineTypeSlug: string, machineCategory: string, hasWeightStep: boolean): "weighted" | "bodyweight" | "assisted" {
  if (machineTypeSlug === "assisted_pullup") return "assisted";
  if (machineCategory === "accessory" && !hasWeightStep) return "bodyweight";
  return "weighted";
}

export type CatalogExercise = {
  id: string;
  slug: string;
  name: string;
  machine_type_slug: string;
  machine_category: string; // machine | multi | free_weight | accessory | cardio
  movement_pattern: string | null;
  primary_muscles: string[];
  is_free_weight: boolean;
  default_sets: number;
  default_rep_min: number;
  default_rep_max: number;
};

export type GymEquipmentItem = {
  id: string;
  machine_type_slug: string;
  status: string; // pending | verified | disputed | removed
};

export type Preference = { replacement_exercise_id: string | null; excluded: boolean };

export type GeneratorInput = {
  sessionsPerWeek: 2 | 3 | 4;
  experience: Experience;
  catalog: CatalogExercise[];
  equipment: GymEquipmentItem[];
  preferences?: Record<string, Preference>; // nøgle: original_exercise_id
  /**
   * 12-ugers-opdatering: "flere øvelser med frie vægte". De store flerledsøvelser
   * (squat, pres, roning, hinge) vælges så med frie vægte, når udstyret findes.
   * Isolation og core bliver på maskiner.
   */
  moreFreeWeights?: boolean;
};

export type PlannedExercise = {
  exercise_id: string;
  equipment_id: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  slot: string;
};

export type PlannedDay = { name: string; exercises: PlannedExercise[] };

export type GeneratedProgram = {
  days: PlannedDay[];
  /** Muskelgrupper, som centrets udstyr ikke kunne dække */
  uncovered: MuscleGroup[];
};

export type MuscleGroup = "chest" | "back" | "shoulders" | "quads" | "hamstrings" | "glutes" | "arms" | "core";

const GROUP_MUSCLES: Record<MuscleGroup, string[]> = {
  chest: ["chest"],
  back: ["lats", "upper_back"],
  shoulders: ["front_delts", "side_delts", "rear_delts"],
  quads: ["quads"],
  hamstrings: ["hamstrings"],
  glutes: ["glutes"],
  arms: ["biceps", "triceps"],
  core: ["abs", "obliques"],
};

/** Ekstra udstyr en øvelse kræver ud over sin egen maskintype */
const REQUIRES: Record<string, string[]> = {
  db_bench_press: ["adjustable_bench"],
  db_row: ["adjustable_bench"],
  db_shoulder_press: ["adjustable_bench"],
  smith_bench_press: ["adjustable_bench"],
  bb_bench_press: ["barbell", "adjustable_bench"],
  bb_back_squat: ["barbell"],
};

/** Et slot accepterer ét eller flere bevægelsesmønstre (i prioriteret rækkefølge) */
type Slot = { id: string; patterns: string[] };

const S = (id: string, ...patterns: string[]): Slot => ({ id, patterns });

// Store flerledsøvelser først, derefter isolation og core
const CORE_FULL_BODY: Slot[] = [
  S("squat", "squat", "lunge"),
  S("push_h", "push_horizontal", "dip"),
  S("pull_v", "pull_vertical"),
  S("pull_h", "pull_horizontal"),
  S("hamstrings", "knee_flexion", "hinge", "hip_extension"),
];

const FULL_BODY_ACCESSORIES: Slot[][] = [
  [S("push_v", "push_vertical", "lateral_raise"), S("biceps", "elbow_flexion"), S("calves", "calf_raise"), S("core", "core_flexion", "core_anti_extension")],
  [S("quads_iso", "knee_extension"), S("triceps", "elbow_extension", "dip"), S("rear_delts", "rear_delt_fly", "lateral_raise"), S("core", "core_anti_extension", "core_anti_rotation", "core_flexion")],
  [S("glutes", "hip_extension", "hip_abduction"), S("chest_fly", "chest_fly"), S("side_delts", "lateral_raise", "push_vertical"), S("core", "core_anti_rotation", "core_flexion", "core_anti_extension")],
];

const UPPER: Slot[][] = [
  [S("push_h", "push_horizontal", "dip"), S("pull_v", "pull_vertical"), S("push_v", "push_vertical"), S("pull_h", "pull_horizontal"), S("chest_fly", "chest_fly"), S("biceps", "elbow_flexion"), S("triceps", "elbow_extension", "dip"), S("rear_delts", "rear_delt_fly")],
  [S("pull_h", "pull_horizontal"), S("push_h", "push_horizontal", "dip"), S("pull_v", "pull_vertical"), S("side_delts", "lateral_raise", "push_vertical"), S("triceps", "elbow_extension", "dip"), S("biceps", "elbow_flexion"), S("rear_delts", "rear_delt_fly", "pull_horizontal")],
];

const LOWER: Slot[][] = [
  [S("squat", "squat", "lunge"), S("hamstrings", "knee_flexion", "hinge"), S("glutes", "hip_extension", "hinge"), S("quads_iso", "knee_extension"), S("calves", "calf_raise"), S("abductors", "hip_abduction"), S("core", "core_flexion", "core_anti_extension")],
  [S("squat", "squat", "lunge"), S("hinge", "hinge", "hip_extension", "knee_flexion"), S("hamstrings", "knee_flexion"), S("adductors", "hip_adduction"), S("calves", "calf_raise"), S("core", "core_anti_rotation", "core_anti_extension", "core_flexion"), S("core2", "core_flexion", "core_anti_extension")],
];

/** Lavere tal = foretrukket. Maskiner først, frie vægte sidst. */
function tier(e: CatalogExercise): number {
  if (e.is_free_weight) return 3;
  // Assisteret maskine er god, men almindelig maskine (fx lat pulldown) foretrækkes
  if (e.machine_type_slug === "assisted_pullup") return 1;
  if (e.machine_category === "machine") return 0;
  if (e.machine_category === "multi") return 1;
  return 2; // kropsvægt/standardudstyr
}

const STATUS_RANK: Record<string, number> = { verified: 0, pending: 1, disputed: 2 };

const COMPOUND = new Set(["squat", "lunge", "push_horizontal", "push_vertical", "pull_horizontal", "hinge"]);

export function generateProgram(input: GeneratorInput): GeneratedProgram {
  const rankOf = (e: CatalogExercise) =>
    input.moreFreeWeights && e.is_free_weight && COMPOUND.has(e.movement_pattern ?? "") ? -1 : tier(e);
  const prefs = input.preferences ?? {};
  const usable = input.equipment.filter((e) => e.status !== "removed");

  // Bedste udstyrsrække pr. maskintype (bekræftet før afventende)
  const equipmentByType = new Map<string, GymEquipmentItem>();
  for (const e of [...usable].sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9))) {
    if (!equipmentByType.has(e.machine_type_slug)) equipmentByType.set(e.machine_type_slug, e);
  }

  const byId = new Map(input.catalog.map((e) => [e.id, e]));
  const available = (e: CatalogExercise) =>
    equipmentByType.has(e.machine_type_slug) && (REQUIRES[e.slug] ?? []).every((r) => equipmentByType.has(r));

  /** Anvend præferencer: udeladt → væk; foretrukket alternativ → brug det, hvis det er tilgængeligt */
  const resolve = (e: CatalogExercise): CatalogExercise | null => {
    const p = prefs[e.id];
    if (!p) return e;
    if (p.excluded) return null;
    if (p.replacement_exercise_id) {
      const r = byId.get(p.replacement_exercise_id);
      if (r && available(r) && !prefs[r.id]?.excluded) return r;
    }
    return e;
  };

  const candidatesFor = (slot: Slot): CatalogExercise[] => {
    const out: CatalogExercise[] = [];
    for (const e of input.catalog) {
      if (!slot.patterns.includes(e.movement_pattern ?? "") || !available(e)) continue;
      const r = resolve(e);
      if (r && !out.some((o) => o.id === r.id)) out.push(r);
    }
    // Maskine først (tier), dernæst mønstrets prioritet i slottet, så navn for stabil rækkefølge
    const rank = (e: CatalogExercise) => {
      const i = slot.patterns.indexOf(e.movement_pattern ?? "");
      return i === -1 ? slot.patterns.length : i;
    };
    return out.sort((a, b) => rankOf(a) - rankOf(b) || rank(a) - rank(b) || a.slug.localeCompare(b.slug));
  };

  const setsFor = (e: CatalogExercise) => {
    const compound = ["squat", "lunge", "push_horizontal", "push_vertical", "pull_vertical", "pull_horizontal", "hinge", "dip"].includes(
      e.movement_pattern ?? "",
    );
    if (input.experience === "intermediate") return Math.max(3, e.default_sets);
    if (input.experience === "returning") return compound ? Math.max(2, e.default_sets) : 2;
    return e.default_sets; // nybegynder: katalogets 2–3 sæt
  };

  const buildDay = (name: string, slots: Slot[], variant: number): PlannedDay => {
    const used = new Set<string>();
    const exercises: PlannedExercise[] = [];
    for (const slot of slots) {
      const cands = candidatesFor(slot).filter((c) => !used.has(c.id));
      if (cands.length === 0) continue; // tving intet ind
      // Variation mellem dage: vælg en anden kandidat i samme (bedste) niveau, hvis der er flere
      const best = cands.filter((c) => rankOf(c) === rankOf(cands[0]) && c.movement_pattern === cands[0].movement_pattern);
      const pick = best[variant % best.length];
      used.add(pick.id);
      const eq = equipmentByType.get(pick.machine_type_slug)!;
      exercises.push({
        exercise_id: pick.id,
        equipment_id: eq.id,
        sets: setsFor(pick),
        rep_min: pick.default_rep_min,
        rep_max: pick.default_rep_max,
        slot: slot.id,
      });
    }
    return { name, exercises };
  };

  let days: PlannedDay[];
  if (input.sessionsPerWeek === 4) {
    days = [
      buildDay("Overkrop A", UPPER[0], 0),
      buildDay("Underkrop A", LOWER[0], 0),
      buildDay("Overkrop B", UPPER[1], 1),
      buildDay("Underkrop B", LOWER[1], 1),
    ];
  } else {
    const n = input.sessionsPerWeek;
    days = Array.from({ length: n }, (_, i) =>
      buildDay(`Fuld krop ${"ABC"[i]}`, [...CORE_FULL_BODY, ...FULL_BODY_ACCESSORIES[i]], i),
    );
  }
  days = days.filter((d) => d.exercises.length > 0);

  // Dækning af muskelgrupper over hele ugen
  const trained = new Set<string>();
  for (const d of days)
    for (const pe of d.exercises) for (const m of byId.get(pe.exercise_id)?.primary_muscles ?? []) trained.add(m);
  const uncovered = (Object.keys(GROUP_MUSCLES) as MuscleGroup[]).filter(
    (g) => !GROUP_MUSCLES[g].some((m) => trained.has(m)),
  );

  return { days, uncovered };
}
