import { describe, expect, it } from "vitest";
import { nearestValidWeight, nextValidWeight, validateWeightSettings, validWeights } from "./weights";

describe("validWeights", () => {
  it("laver trin fra min til max", () => {
    expect(validWeights({ weight_step_kg: 7, min_weight_kg: 7, max_weight_kg: 35 })).toEqual([7, 14, 21, 28, 35]);
  });

  it("tilføjer mellemplade på hvert trin", () => {
    expect(validWeights({ weight_step_kg: 7, extra_plate_kg: 3.5, min_weight_kg: 7, max_weight_kg: 21 })).toEqual([
      7, 10.5, 14, 17.5, 21, 24.5,
    ]);
  });

  it("håndterer halve kilo uden flydende-komma-fejl", () => {
    const w = validWeights({ weight_step_kg: 2.5, min_weight_kg: 2.5, max_weight_kg: 10 });
    expect(w).toEqual([2.5, 5, 7.5, 10]);
    expect(validWeights({ weight_step_kg: 0.1, min_weight_kg: 0.1, max_weight_kg: 0.3 })).toEqual([0.1, 0.2, 0.3]);
  });

  it("bruger trinnet som laveste vægt, når min mangler", () => {
    expect(validWeights({ weight_step_kg: 5, max_weight_kg: 15 })).toEqual([5, 10, 15]);
  });

  it("lægger et loft på 40 trin, når max mangler", () => {
    const w = validWeights({ weight_step_kg: 5, min_weight_kg: 5 });
    expect(w.length).toBe(41);
    expect(w.at(-1)).toBe(205);
  });

  it("ignorerer max under min", () => {
    expect(validWeights({ weight_step_kg: 5, min_weight_kg: 20, max_weight_kg: 10 })[0]).toBe(20);
  });

  it("giver tom liste uden vægttrin", () => {
    expect(validWeights({ weight_step_kg: null })).toEqual([]);
    expect(validWeights({ weight_step_kg: 0 })).toEqual([]);
  });

  it("stopper ved max, også når max ikke rammer et helt trin", () => {
    expect(validWeights({ weight_step_kg: 7, min_weight_kg: 7, max_weight_kg: 30 })).toEqual([7, 14, 21, 28]);
  });
});

describe("nearestValidWeight / nextValidWeight", () => {
  const s = { weight_step_kg: 7, extra_plate_kg: 3.5, min_weight_kg: 7, max_weight_kg: 35 };

  it("finder nærmeste gyldige vægt", () => {
    expect(nearestValidWeight(30, s)).toBe(31.5);
    expect(nearestValidWeight(1, s)).toBe(7);
  });

  it("vælger den lettere ved lige afstand", () => {
    expect(nearestValidWeight(12.25, s)).toBe(10.5);
  });

  it("finder næste trin, inkl. mellemplade", () => {
    expect(nextValidWeight(14, s)).toBe(17.5);
    expect(nextValidWeight(38.5, s)).toBeNull();
  });
});

describe("validateWeightSettings", () => {
  it("accepterer gyldige og tomme indstillinger", () => {
    expect(validateWeightSettings({ weight_step_kg: null })).toBeNull();
    expect(validateWeightSettings({ weight_step_kg: 7, extra_plate_kg: 3.5, min_weight_kg: 7, max_weight_kg: 105 })).toBeNull();
  });

  it("afviser ugyldige værdier", () => {
    expect(validateWeightSettings({ weight_step_kg: -1 })).toMatch(/Vægttrin/);
    expect(validateWeightSettings({ weight_step_kg: 7, extra_plate_kg: 7 })).toMatch(/Mellempladen/);
    expect(validateWeightSettings({ weight_step_kg: 7, min_weight_kg: 50, max_weight_kg: 10 })).toMatch(/Højeste/);
  });
});
