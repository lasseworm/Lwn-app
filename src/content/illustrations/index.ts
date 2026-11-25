/**
 * MIDLERTIDIGE stregtegninger af øvelserne – kun til test.
 * Skal erstattes af rigtige illustrationer/fotos, før appen bruges af andre (se docs).
 * Hver øvelse vises i to trin: start og slut. Nøgle = exercises.slug.
 */
import type { PoseSpec, Prop, Pt } from "./geometry";

export type Illustration = { start: PoseSpec; end: PoseSpec; props: Prop[] };

// ------------------------------------------------------------------ Kulisser

/** Sæde med ryglæn; hoften sidder i (x, 74) */
const seat = (x = 40, back = true): Prop[] => [
  { k: "rect", x: x - 12, y: 75, w: 24, h: 4 },
  { k: "line", pts: [[x, 79], [x, 92]] },
  ...(back ? [{ k: "line", pts: [[x - 5, 76], [x - 5, 42]], w: 3 } as Prop] : []),
];

/** Flad bænk (ryg eller mave på bænken) */
const bench = (x1 = 18, x2 = 70, y = 64): Prop[] => [
  { k: "rect", x: x1, y, w: x2 - x1, h: 4 },
  { k: "line", pts: [[x1 + 5, y + 4], [x1 + 5, 92]] },
  { k: "line", pts: [[x2 - 5, y + 4], [x2 - 5, 92]] },
];

const pulley = (p: Pt): Prop => ({ k: "line", pts: [p, [p[0], p[1] < 50 ? 2 : 92]], w: 3 });

// ------------------------------------------------------------------ Grundstillinger
const SEATED = { hip: [40, 74] as Pt, neck: [40, 46] as Pt, ankle: [59, 92] as Pt };
const STAND = { hip: [52, 55] as Pt, neck: [52, 27] as Pt, ankle: [52, 92] as Pt };
const SUPINE = { hip: [62, 63] as Pt, neck: [34, 63] as Pt, ankle: [78, 92] as Pt };

// Squat: stående → nede (hofte tilbage og ned, knæ frem)
const SQUAT_TOP: PoseSpec = { hip: [50, 55], neck: [52, 27], ankle: [52, 92] };
const SQUAT_BOTTOM: PoseSpec = { hip: [38, 72], neck: [52, 47], ankle: [52, 92] };

// Bænkpres: hånd ved brystet → strakte arme
const PRESS_LOW: Pt = [38, 56];
const PRESS_HIGH: Pt = [36, 37];

// Dips: oppe → nede (hænderne på håndtagene i samme højde)
const DIP_UP: PoseSpec = { hip: [50, 58], neck: [50, 30], hand: [50, 57], ankle: [40, 80] };
const DIP_DOWN: PoseSpec = { hip: [50, 68], neck: [52, 40], hand: [50, 57], ankle: [40, 90] };

// Hængende: armene strakt op til en stang i y = 14
const HANG: PoseSpec = { hip: [50, 69], neck: [50, 41], hand: [50, 14], ankle: [42, 90] };

export const illustrations: Record<string, Illustration> = {
  // ------------------------------------------------------------ Bryst
  machine_chest_press: {
    start: { ...SEATED, hand: [52, 50] },
    end: { ...SEATED, hand: [66, 48] },
    props: [...seat(), { k: "handle", at: "hand" }],
  },
  smith_bench_press: {
    start: { ...SUPINE, hand: PRESS_LOW },
    end: { ...SUPINE, hand: PRESS_HIGH },
    props: [...bench(), { k: "line", pts: [[30, 2], [30, 92]], w: 2 }, { k: "plate", at: "hand" }],
  },
  db_bench_press: {
    start: { ...SUPINE, hand: PRESS_LOW },
    end: { ...SUPINE, hand: PRESS_HIGH },
    props: [...bench(), { k: "dumbbell", at: "hand" }],
  },
  bb_bench_press: {
    start: { ...SUPINE, hand: PRESS_LOW },
    end: { ...SUPINE, hand: PRESS_HIGH },
    props: [...bench(), { k: "line", pts: [[22, 30], [22, 92]], w: 2 }, { k: "plate", at: "hand", r: 8 }],
  },
  machine_chest_fly: {
    start: { ...SEATED, hand: [22, 44] },
    end: { ...SEATED, hand: [64, 44] },
    props: [...seat(), { k: "pad", at: "hand" }],
  },
  cable_fly: {
    start: { ...STAND, hand: [30, 36] },
    end: { ...STAND, hand: [74, 46] },
    props: [pulley([14, 14]), { k: "cable", from: [14, 14], at: "hand" }, { k: "handle", at: "hand" }],
  },

  // ------------------------------------------------------------ Skuldre
  machine_shoulder_press: {
    start: { ...SEATED, hand: [47, 40] },
    end: { ...SEATED, hand: [42, 18] },
    props: [...seat(), { k: "handle", at: "hand" }],
  },
  db_shoulder_press: {
    start: { ...SEATED, hand: [47, 40] },
    end: { ...SEATED, hand: [42, 18] },
    props: [...seat(), { k: "dumbbell", at: "hand" }],
  },
  db_lateral_raise: {
    start: { hip: [50, 55], neck: [50, 27], front: true, hand: [40, 54], hand2: [60, 54], ankle: [46, 92], ankle2: [54, 92] },
    end: { hip: [50, 55], neck: [50, 27], front: true, hand: [18, 31], hand2: [82, 31], ankle: [46, 92], ankle2: [54, 92] },
    props: [{ k: "dumbbell", at: "hand" }, { k: "dumbbell", at: "hand2" }],
  },
  machine_lateral_raise: {
    start: { hip: [50, 74], neck: [50, 46], front: true, hand: [42, 70], hand2: [58, 70], ankle: [44, 92], ankle2: [56, 92] },
    end: { hip: [50, 74], neck: [50, 46], front: true, hand: [20, 50], hand2: [80, 50], ankle: [44, 92], ankle2: [56, 92] },
    props: [{ k: "rect", x: 38, y: 75, w: 24, h: 4 }, { k: "line", pts: [[50, 79], [50, 92]] }, { k: "pad", at: "elbow" }],
  },
  machine_reverse_fly: {
    start: { ...SEATED, hand: [66, 46] },
    end: { ...SEATED, hand: [16, 46] },
    props: [...seat(40, false), { k: "rect", x: 44, y: 46, w: 4, h: 22 }, { k: "handle", at: "hand" }],
  },
  machine_reverse_fly_pec: {
    start: { ...SEATED, hand: [66, 46] },
    end: { ...SEATED, hand: [16, 46] },
    props: [...seat(40, false), { k: "rect", x: 44, y: 46, w: 4, h: 22 }, { k: "handle", at: "hand" }],
  },
  cable_face_pull: {
    start: { ...STAND, hand: [76, 30] },
    end: { ...STAND, hand: [60, 22] },
    props: [pulley([90, 24]), { k: "cable", from: [90, 24], at: "hand" }, { k: "handle", at: "hand" }],
  },

  // ------------------------------------------------------------ Ryg
  machine_lat_pulldown: {
    start: { ...SEATED, hand: [44, 20] },
    end: { ...SEATED, hand: [46, 46] },
    props: [...seat(40, false), pulley([44, 4]), { k: "cable", from: [44, 4], at: "hand" }, { k: "handle", at: "hand" }, { k: "pad", at: "knee" }],
  },
  machine_assisted_pullup: {
    start: { hip: [50, 54], neck: [50, 26], hand: [52, 4], ankle: [32, 72] },
    end: { hip: [50, 42], neck: [50, 14], hand: [52, 4], ankle: [32, 60] },
    props: [{ k: "line", pts: [[40, 4], [64, 4]], w: 3 }, { k: "pad", at: "knee" }],
  },
  bar_pullup: {
    start: HANG,
    end: { hip: [50, 44], neck: [50, 16], hand: [53, 14], ankle: [42, 72] },
    props: [{ k: "line", pts: [[30, 14], [70, 14]], w: 3 }],
  },
  machine_seated_row: {
    start: { ...SEATED, hand: [66, 50] },
    end: { ...SEATED, hand: [46, 52] },
    props: [...seat(40, false), { k: "rect", x: 46, y: 48, w: 4, h: 20 }, { k: "handle", at: "hand" }],
  },
  cable_row: {
    start: { hip: [32, 80], neck: [40, 53], hand: [64, 66], ankle: [70, 82] },
    end: { hip: [32, 80], neck: [30, 52], hand: [40, 66], ankle: [70, 82] },
    props: [{ k: "rect", x: 20, y: 81, w: 24, h: 4 }, { k: "line", pts: [[74, 72], [74, 90]], w: 3 }, pulley([88, 70]), { k: "cable", from: [88, 70], at: "hand" }, { k: "handle", at: "hand" }],
  },
  db_row: {
    start: { hip: [68, 55], neck: [41, 50], hand: [42, 76], ankle: [68, 92], hand2: [36, 74] },
    end: { hip: [68, 55], neck: [41, 50], hand: [54, 58], ankle: [68, 92], hand2: [36, 74] },
    props: [{ k: "rect", x: 20, y: 75, w: 30, h: 4 }, { k: "line", pts: [[24, 79], [24, 92]] }, { k: "line", pts: [[46, 79], [46, 92]] }, { k: "dumbbell", at: "hand" }],
  },

  // ------------------------------------------------------------ Arme
  db_biceps_curl: {
    start: { ...STAND, hand: [54, 56] },
    end: { ...STAND, hand: [61, 34] },
    props: [{ k: "dumbbell", at: "hand" }],
  },
  machine_biceps_curl: {
    start: { ...SEATED, hand: [70, 58] },
    end: { ...SEATED, hand: [52, 38] },
    props: [...seat(40, false), { k: "line", pts: [[42, 52], [58, 56]], w: 4 }, { k: "handle", at: "hand" }],
  },
  cable_biceps_curl: {
    start: { ...STAND, hand: [56, 54] },
    end: { ...STAND, hand: [60, 32] },
    props: [pulley([72, 90]), { k: "cable", from: [72, 90], at: "hand" }, { k: "handle", at: "hand" }],
  },
  cable_triceps_pushdown: {
    start: { ...STAND, hand: [64, 44] },
    end: { ...STAND, hand: [54, 56] },
    props: [pulley([66, 4]), { k: "cable", from: [66, 4], at: "hand" }, { k: "handle", at: "hand" }],
  },
  machine_triceps_ext: {
    start: { ...SEATED, hand: [56, 40] },
    end: { ...SEATED, hand: [72, 62] },
    props: [...seat(), { k: "line", pts: [[46, 60], [60, 54]], w: 4 }, { k: "handle", at: "hand" }],
  },
  dip_station_dip: {
    start: DIP_UP,
    end: DIP_DOWN,
    props: [{ k: "line", pts: [[38, 58], [66, 58]], w: 3 }, { k: "line", pts: [[62, 58], [62, 92]] }],
  },
  machine_assisted_dip: {
    start: { ...DIP_UP, ankle: [36, 70] },
    end: { ...DIP_DOWN, ankle: [36, 80] },
    props: [{ k: "line", pts: [[38, 58], [66, 58]], w: 3 }, { k: "line", pts: [[62, 58], [62, 92]] }, { k: "pad", at: "knee" }],
  },
  station_dip: {
    start: DIP_UP,
    end: DIP_DOWN,
    props: [{ k: "line", pts: [[36, 20], [36, 92]], w: 3 }, { k: "line", pts: [[36, 58], [64, 58]], w: 3 }],
  },

  // ------------------------------------------------------------ Ben
  machine_leg_press: {
    start: { hip: [30, 70], neck: [12, 49], hand: [36, 74], ankle: [58, 62] },
    end: { hip: [30, 70], neck: [12, 49], hand: [36, 74], ankle: [64, 50] },
    props: [{ k: "line", pts: [[8, 46], [26, 74], [44, 74]], w: 3 }, { k: "line", pts: [[30, 74], [30, 92]] }, { k: "pad", at: "ankle" }],
  },
  machine_hack_squat: {
    start: { hip: [48, 52], neck: [40, 25], hand: [42, 26], ankle: [58, 88] },
    end: { hip: [44, 68], neck: [34, 42], hand: [36, 43], ankle: [58, 88] },
    props: [{ k: "line", pts: [[30, 18], [44, 80]], w: 3 }, { k: "line", pts: [[52, 92], [70, 86]], w: 3 }, { k: "pad", at: "neck" }],
  },
  smith_squat: {
    start: { ...SQUAT_TOP, hand: [48, 30] },
    end: { ...SQUAT_BOTTOM, hand: [48, 48] },
    props: [{ k: "line", pts: [[48, 2], [48, 92]], w: 2 }, { k: "plate", at: "hand", r: 5 }],
  },
  bb_back_squat: {
    start: { ...SQUAT_TOP, hand: [48, 30] },
    end: { ...SQUAT_BOTTOM, hand: [48, 48] },
    props: [{ k: "plate", at: "hand", r: 7 }],
  },
  db_goblet_squat: {
    start: { ...SQUAT_TOP, hand: [60, 36] },
    end: { ...SQUAT_BOTTOM, hand: [62, 56] },
    props: [{ k: "dumbbell", at: "hand" }],
  },
  db_split_squat: {
    start: { hip: [48, 55], neck: [48, 27], ankle: [62, 92], ankle2: [26, 88], foot: 0 },
    end: { hip: [46, 68], neck: [47, 40], ankle: [62, 92], ankle2: [26, 88] },
    props: [{ k: "dumbbell", at: "hand" }],
  },
  machine_leg_extension: {
    start: { ...SEATED, ankle: [58, 92] },
    end: { ...SEATED, ankle: [76, 72] },
    props: [...seat(), { k: "pad", at: "ankle" }],
  },
  machine_seated_leg_curl: {
    start: { ...SEATED, ankle: [76, 72] },
    end: { ...SEATED, ankle: [52, 90] },
    props: [...seat(), { k: "pad", at: "ankle" }, { k: "pad", at: "knee" }],
  },
  machine_lying_leg_curl: {
    start: { hip: [55, 61], neck: [27, 61], hand: [20, 66], ankle: [91, 61], facing: -1 },
    end: { hip: [55, 61], neck: [27, 61], hand: [20, 66], ankle: [70, 44], facing: -1 },
    props: [...bench(16, 78), { k: "pad", at: "ankle" }],
  },
  machine_calf_raise: {
    start: { ...STAND, hand: [46, 30] },
    end: { hip: [52, 50], neck: [52, 22], ankle: [52, 87], hand: [46, 25], foot: 40 },
    props: [{ k: "rect", x: 50, y: 90, w: 14, h: 2 }, { k: "pad", at: "neck" }],
  },
  machine_hip_thrust: {
    start: { hip: [44, 84], neck: [22, 64], hand: [42, 84], ankle: [66, 92] },
    end: { hip: [48, 64], neck: [20, 64], hand: [46, 64], ankle: [66, 92] },
    props: [{ k: "rect", x: 4, y: 65, w: 20, h: 4 }, { k: "line", pts: [[8, 69], [8, 92]] }, { k: "pad", at: "hip" }],
  },
  mat_glute_bridge: {
    start: { hip: [44, 88], neck: [16, 88], hand: [43, 90], ankle: [62, 92] },
    end: { hip: [46, 72], neck: [21, 86], hand: [45, 90], ankle: [62, 92] },
    props: [{ k: "rect", x: 8, y: 91, w: 70, h: 1.5 }],
  },
  machine_hip_abduction: {
    start: { hip: [50, 74], neck: [50, 46], front: true, hand: [34, 70], hand2: [66, 70], ankle: [44, 92], ankle2: [56, 92] },
    end: { hip: [50, 74], neck: [50, 46], front: true, hand: [34, 70], hand2: [66, 70], ankle: [26, 88], ankle2: [74, 88] },
    props: [{ k: "rect", x: 38, y: 75, w: 24, h: 4 }, { k: "pad", at: "knee" }],
  },
  machine_hip_adduction: {
    start: { hip: [50, 74], neck: [50, 46], front: true, hand: [34, 70], hand2: [66, 70], ankle: [26, 88], ankle2: [74, 88] },
    end: { hip: [50, 74], neck: [50, 46], front: true, hand: [34, 70], hand2: [66, 70], ankle: [44, 92], ankle2: [56, 92] },
    props: [{ k: "rect", x: 38, y: 75, w: 24, h: 4 }, { k: "pad", at: "knee" }],
  },
  db_romanian_deadlift: {
    start: { ...STAND, hand: [54, 58] },
    end: { hip: [42, 55], neck: [70, 48], hand: [66, 76], ankle: [50, 92] },
    props: [{ k: "dumbbell", at: "hand" }],
  },
  bb_romanian_deadlift: {
    start: { ...STAND, hand: [54, 58] },
    end: { hip: [42, 55], neck: [70, 48], hand: [66, 76], ankle: [50, 92] },
    props: [{ k: "plate", at: "hand", r: 8 }],
  },
  back_extension: {
    start: { hip: [50, 52], neck: [56, 80], hand: [58, 72], ankle: [24, 79] },
    end: { hip: [50, 52], neck: [76, 34], hand: [70, 42], ankle: [24, 79] },
    props: [{ k: "line", pts: [[44, 58], [20, 82]], w: 4 }, { k: "line", pts: [[30, 72], [30, 92]] }],
  },

  // ------------------------------------------------------------ Mave og core
  mat_plank: {
    start: { hip: [50, 80], neck: [24, 76], hand: [13, 90], ankle: [86, 88], foot: 90, facing: -1 },
    end: { hip: [50, 80], neck: [24, 76], hand: [13, 90], ankle: [86, 88], foot: 90, facing: -1 },
    props: [{ k: "rect", x: 10, y: 91, w: 76, h: 1.5 }],
  },
  mat_side_plank: {
    start: { hip: [52, 88], neck: [25, 78], hand: [13, 90], ankle: [88, 90], foot: 90, facing: -1 },
    end: { hip: [52, 80], neck: [25, 76], hand: [13, 90], ankle: [88, 90], foot: 90, facing: -1 },
    props: [{ k: "rect", x: 10, y: 91, w: 76, h: 1.5 }],
  },
  mat_dead_bug: {
    start: { hip: [56, 88], neck: [28, 88], hand: [30, 62], ankle: [70, 70] },
    end: { hip: [56, 88], neck: [28, 88], hand: [6, 82], ankle: [90, 84] },
    props: [{ k: "rect", x: 10, y: 91, w: 80, h: 1.5 }],
  },
  ab_roller_rollout: {
    start: { hip: [62, 66], neck: [50, 41], hand: [44, 85], ankle: [82, 90], facing: -1, foot: 0 },
    end: { hip: [52, 78], neck: [27, 68], hand: [12, 85], ankle: [82, 90], facing: -1, foot: 0 },
    props: [{ k: "plate", at: "hand", r: 5 }, { k: "rect", x: 50, y: 91, w: 40, h: 1.5 }],
  },
  machine_ab_crunch: {
    start: { ...SEATED, hand: [46, 40] },
    end: { hip: [40, 74], neck: [58, 54], hand: [62, 50], ankle: [59, 92] },
    props: [...seat(40, false), { k: "handle", at: "hand" }],
  },
  bar_hanging_knee_raise: {
    start: HANG,
    end: { ...HANG, ankle: [70, 76] },
    props: [{ k: "line", pts: [[30, 14], [70, 14]], w: 3 }],
  },
  station_knee_raise: {
    start: { hip: [45, 54], neck: [45, 26], hand: [60, 40], ankle: [45, 90] },
    end: { hip: [45, 54], neck: [45, 26], hand: [60, 40], ankle: [66, 70] },
    props: [{ k: "line", pts: [[40, 22], [40, 92]], w: 3 }, { k: "line", pts: [[40, 42], [64, 42]], w: 3 }],
  },
  cable_pallof_press: {
    start: { ...STAND, hand: [56, 40] },
    end: { ...STAND, hand: [76, 38] },
    props: [pulley([10, 40]), { k: "cable", from: [10, 40], at: "hand" }, { k: "handle", at: "hand" }],
  },
};

