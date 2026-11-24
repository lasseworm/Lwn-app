import { describe, expect, it } from "vitest";
import catalogJson from "./__fixtures__/catalog.json";
import { generateProgram, type CatalogExercise, type GymEquipmentItem } from "./generator";

// Det rigtige startkatalog (eksporteret fra databasen); id = slug for læsbarhed
const catalog = catalogJson as CatalogExercise[];

const gym = (...slugs: string[]): GymEquipmentItem[] =>
  slugs.map((s) => ({ id: `eq_${s}`, machine_type_slug: s, status: "verified" }));

const MACHINE_GYM = gym(
  "chest_press", "pec_deck", "shoulder_press", "lateral_raise_machine", "rear_delt_machine", "lat_pulldown",
  "seated_row", "leg_press", "leg_extension", "seated_leg_curl", "hip_adduction", "hip_abduction",
  "hip_thrust_machine", "calf_raise_machine", "biceps_curl_machine", "triceps_extension_machine", "ab_crunch_machine",
  "cable_station", "dumbbells", "adjustable_bench", "mat",
);

const byId = new Map(catalog.map((e) => [e.id, e]));
const allExercises = (p: ReturnType<typeof generateProgram>) => p.days.flatMap((d) => d.exercises);

describe("generateProgram – struktur", () => {
  it("2 pas: fuld krop A/B", () => {
    const p = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment: MACHINE_GYM });
    expect(p.days.map((d) => d.name)).toEqual(["Fuld krop A", "Fuld krop B"]);
  });

  it("3 pas: fuld krop A/B/C", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: MACHINE_GYM });
    expect(p.days.map((d) => d.name)).toEqual(["Fuld krop A", "Fuld krop B", "Fuld krop C"]);
  });

  it("4 pas: over/under × 2", () => {
    const p = generateProgram({ sessionsPerWeek: 4, experience: "beginner", catalog, equipment: MACHINE_GYM });
    expect(p.days.map((d) => d.name)).toEqual(["Overkrop A", "Underkrop A", "Overkrop B", "Underkrop B"]);
  });

  it("nybegyndervolumen: 8–10 øvelser pr. pas, 2–3 sæt, rep-interval fra kataloget", () => {
    for (const n of [2, 3, 4] as const) {
      const p = generateProgram({ sessionsPerWeek: n, experience: "beginner", catalog, equipment: MACHINE_GYM });
      for (const d of p.days) {
        expect(d.exercises.length, `${n} pas – ${d.name}`).toBeGreaterThanOrEqual(7);
        expect(d.exercises.length, `${n} pas – ${d.name}`).toBeLessThanOrEqual(10);
        for (const e of d.exercises) {
          expect(e.sets).toBeGreaterThanOrEqual(2);
          expect(e.sets).toBeLessThanOrEqual(3);
          expect(e.rep_min).toBeLessThan(e.rep_max);
        }
      }
    }
  });

  it("ingen øvelse to gange samme dag", () => {
    for (const n of [2, 3, 4] as const) {
      const p = generateProgram({ sessionsPerWeek: n, experience: "beginner", catalog, equipment: MACHINE_GYM });
      for (const d of p.days) expect(new Set(d.exercises.map((e) => e.exercise_id)).size).toBe(d.exercises.length);
    }
  });
});

describe("generateProgram – udstyr og frie vægte", () => {
  it("fuldt maskincenter: alle muskelgrupper dækket og ingen frie vægte", () => {
    for (const n of [2, 3, 4] as const) {
      const p = generateProgram({ sessionsPerWeek: n, experience: "beginner", catalog, equipment: MACHINE_GYM });
      expect(p.uncovered, `${n} pas`).toEqual([]);
      expect(allExercises(p).filter((e) => byId.get(e.exercise_id)!.is_free_weight)).toEqual([]);
    }
  });

  it("maskiner først: brystpres i maskine frem for håndvægte", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: MACHINE_GYM });
    const pushH = p.days[0].exercises.find((e) => e.slot === "push_h")!;
    expect(pushH.exercise_id).toBe("machine_chest_press");
    expect(pushH.equipment_id).toBe("eq_chest_press");
  });

  it("frie vægte bruges kun, når en bevægelse ellers ikke kan dækkes", () => {
    // Ingen benmaskiner – kun håndvægte og bænk til underkroppen
    const equipment = MACHINE_GYM.filter(
      (e) => !["leg_press", "leg_extension", "seated_leg_curl", "hip_thrust_machine"].includes(e.machine_type_slug),
    );
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment });
    const squat = p.days[0].exercises.find((e) => e.slot === "squat")!;
    expect(byId.get(squat.exercise_id)!.is_free_weight).toBe(true); // goblet squat / split squat
    const pushH = p.days[0].exercises.find((e) => e.slot === "push_h")!;
    expect(byId.get(pushH.exercise_id)!.is_free_weight).toBe(false); // brystpres-maskinen findes stadig
  });

  it("tvinger intet ind: lille center giver færre øvelser og rapporterer manglende grupper", () => {
    const p = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment: gym("chest_press", "lat_pulldown") });
    expect(allExercises(p).map((e) => e.exercise_id).sort()).toEqual(
      ["machine_chest_press", "machine_chest_press", "machine_lat_pulldown", "machine_lat_pulldown"].sort(),
    );
    expect(p.uncovered).toEqual(expect.arrayContaining(["quads", "hamstrings", "glutes", "core"]));
  });

  it("tomt center: intet program", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: [] });
    expect(p.days).toEqual([]);
    expect(p.uncovered.length).toBe(8);
  });

  it("udstyrskrav: håndvægtsbænkpres kræver en bænk", () => {
    const equipment = gym("dumbbells", "lat_pulldown");
    const p = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment });
    expect(allExercises(p).some((e) => e.exercise_id === "db_bench_press")).toBe(false);
    const withBench = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment: [...equipment, ...gym("adjustable_bench")] });
    expect(allExercises(withBench).some((e) => e.exercise_id === "db_bench_press")).toBe(true);
  });

  it("fjernet udstyr ignoreres; bekræftet udstyr foretrækkes frem for afventende", () => {
    const equipment: GymEquipmentItem[] = [
      { id: "removed", machine_type_slug: "chest_press", status: "removed" },
      { id: "pending", machine_type_slug: "lat_pulldown", status: "pending" },
      { id: "verified", machine_type_slug: "lat_pulldown", status: "verified" },
    ];
    const p = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment });
    expect(allExercises(p).some((e) => e.exercise_id === "machine_chest_press")).toBe(false);
    expect(allExercises(p).find((e) => e.exercise_id === "machine_lat_pulldown")?.equipment_id).toBe("verified");
  });

  it("multifunktionsudstyr bidrager via kataloget (kabeltårn giver flere øvelser)", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: gym("cable_station", "leg_press") });
    const ids = new Set(allExercises(p).map((e) => e.exercise_id));
    expect(ids.has("cable_row")).toBe(true);
    expect(ids.has("cable_triceps_pushdown") || ids.has("cable_biceps_curl")).toBe(true);
  });
});

describe("generateProgram – variation og præferencer", () => {
  it("varierer mellem dage, når der er flere lige gode muligheder", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: [...MACHINE_GYM, ...gym("lying_leg_curl")] });
    const hams = p.days.map((d) => d.exercises.find((e) => e.slot === "hamstrings")!.exercise_id);
    expect(new Set(hams).size).toBeGreaterThan(1);
  });

  it("udeladt øvelse bruges ikke", () => {
    const p = generateProgram({
      sessionsPerWeek: 3,
      experience: "beginner",
      catalog,
      equipment: MACHINE_GYM,
      preferences: { machine_leg_press: { replacement_exercise_id: null, excluded: true } },
    });
    expect(allExercises(p).some((e) => e.exercise_id === "machine_leg_press")).toBe(false);
  });

  it("foretrukket alternativ huskes", () => {
    const p = generateProgram({
      sessionsPerWeek: 3,
      experience: "beginner",
      catalog,
      equipment: MACHINE_GYM,
      preferences: { machine_chest_press: { replacement_exercise_id: "db_bench_press", excluded: false } },
    });
    const pushH = p.days[0].exercises.find((e) => e.slot === "push_h")!;
    expect(pushH.exercise_id).toBe("db_bench_press");
  });

  it("alternativ uden udstyr: originalen bruges", () => {
    const p = generateProgram({
      sessionsPerWeek: 3,
      experience: "beginner",
      catalog,
      equipment: MACHINE_GYM.filter((e) => e.machine_type_slug !== "adjustable_bench"),
      preferences: { machine_chest_press: { replacement_exercise_id: "db_bench_press", excluded: false } },
    });
    expect(p.days[0].exercises.find((e) => e.slot === "push_h")!.exercise_id).toBe("machine_chest_press");
  });

  it("assisteret pull-up vælges ikke, når lat pulldown findes", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "beginner", catalog, equipment: [...MACHINE_GYM, ...gym("assisted_pullup")] });
    expect(p.days[0].exercises.find((e) => e.slot === "pull_v")!.exercise_id).toBe("machine_lat_pulldown");
    const only = generateProgram({ sessionsPerWeek: 2, experience: "beginner", catalog, equipment: gym("assisted_pullup") });
    expect(allExercises(only).some((e) => e.exercise_id === "machine_assisted_pullup")).toBe(true);
  });

  it("let øvede får mindst 3 sæt", () => {
    const p = generateProgram({ sessionsPerWeek: 3, experience: "intermediate", catalog, equipment: MACHINE_GYM });
    expect(allExercises(p).every((e) => e.sets >= 3)).toBe(true);
  });
});
