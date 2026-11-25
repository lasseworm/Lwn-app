/**
 * Enkle stregtegninger af øvelser (MIDLERTIDIGE – kun til test, se illustrations/index.ts).
 *
 * En figur beskrives med få punkter: hofte, nakke, hænder og ankler. Albuer og knæ
 * beregnes med to-leds-invers kinematik, så man ikke selv skal regne vinkler ud.
 * Koordinater i et 100 × 100-felt, y nedad. Gulvet ligger ved y = 92.
 */
export type Pt = [number, number];

export const FLOOR_Y = 92;

const L = { torso: 28, upperArm: 14, forearm: 13, thigh: 19, shin: 18, foot: 6, headGap: 7.5 };

export type PoseSpec = {
  hip: Pt;
  /** Nakkepunkt (toppen af overkroppen). Afstanden til hoften behøver ikke være præcis. */
  neck: Pt;
  /** Hånd(er). Mangler = armen hænger lodret. */
  hand?: Pt;
  hand2?: Pt;
  /** Ankel/ankler. Mangler = benet står lodret under hoften. */
  ankle?: Pt;
  ankle2?: Pt;
  /**
   * Bøjeretning. Standard er anatomisk: albuen bagud/nedad, knæet fremad (set forfra: udad).
   * -1 vender den om.
   */
  elbow?: 1 | -1;
  elbow2?: 1 | -1;
  knee?: 1 | -1;
  knee2?: 1 | -1;
  /**
   * Hvilken vej kroppen vender: 1 = forsiden mod højre, når man står op (standard).
   * Liggende på maven med hovedet til venstre: -1 (forsiden vender nedad).
   */
  facing?: 1 | -1;
  /** Fodens vinkel i grader (0 = peger fremad/mod højre) */
  foot?: number;
  /** Set forfra: to arme og to ben med skulder-/hoftebredde */
  front?: boolean;
};

export type Joints = {
  head: Pt;
  neck: Pt;
  hip: Pt;
  arms: { sh: Pt; el: Pt; ha: Pt }[];
  legs: { hp: Pt; kn: Pt; an: Pt; toe: Pt | null }[];
};

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const unit = (a: Pt): Pt => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const polar = (deg: number, r: number): Pt => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];

/**
 * To-leds-IK: midterled mellem a og b med segmentlængderne l1 og l2.
 * Af de to mulige løsninger vælges den med højest `score`; flip = 1 vælger den anden.
 */
function ik(a: Pt, b: Pt, l1: number, l2: number, score: (p: Pt) => number, flip: 1 | -1): Pt {
  const v = sub(b, a);
  const d = Math.min(Math.max(len(v), 0.01), l1 + l2 - 0.01);
  const base = Math.atan2(v[1], v[0]);
  const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
  const cand = [base + ang, base - ang].map((t): Pt => [a[0] + Math.cos(t) * l1, a[1] + Math.sin(t) * l1]);
  const [best, other] = score(cand[0]) >= score(cand[1]) ? cand : [cand[1], cand[0]];
  return flip === -1 ? other : best;
}


/** Når målet er uden for rækkevidde, lægges endepunktet strakt i målets retning */
function reach(a: Pt, b: Pt, max: number): Pt {
  const v = sub(b, a);
  return len(v) > max ? add(a, mul(unit(v), max)) : b;
}

export function solve(p: PoseSpec): Joints {
  const up = unit(sub(p.neck, p.hip)); // fra hofte mod nakke
  // Kroppens "fremad" (vinkelret på overkroppen). Albuer bøjer bagud/mod fødderne, knæ fremad.
  const fwd: Pt = mul([-up[1], up[0]], p.facing ?? 1);
  const elbowBackDown = (q: Pt) => -(q[0] * (fwd[0] + up[0]) + q[1] * (fwd[1] + up[1]));
  const kneeForward = (q: Pt) => q[0] * fwd[0] + q[1] * fwd[1];
  const head = add(p.neck, mul(up, L.headGap));
  const shoulder = add(p.neck, mul(up, -2.5));
  // Vinkelret på overkroppen (til skulder-/hoftebredde set forfra)
  const side: Pt = [-up[1], up[0]];

  const arm = (sh: Pt, target: Pt | undefined, score: (p: Pt) => number, flip: 1 | -1 = 1) => {
    const t = reach(sh, target ?? add(sh, [0, L.upperArm + L.forearm]), L.upperArm + L.forearm);
    return { sh, el: ik(sh, t, L.upperArm, L.forearm, score, flip), ha: t };
  };
  const leg = (hp: Pt, target: Pt | undefined, score: (p: Pt) => number, flip: 1 | -1 = 1) => {
    const t = reach(hp, target ?? add(hp, [0, L.thigh + L.shin]), L.thigh + L.shin);
    const toe = p.front ? null : add(t, polar(p.foot ?? 0, L.foot));
    return { hp, kn: ik(hp, t, L.thigh, L.shin, score, flip), an: t, toe };
  };

  if (p.front) {
    // Set forfra: albuer og knæ peger udad fra midterlinjen
    const sL = add(shoulder, mul(side, 7));
    const sR = add(shoulder, mul(side, -7));
    const hL = add(p.hip, mul(side, 4));
    const hR = add(p.hip, mul(side, -4));
    const left = (q: Pt) => -q[0];
    const right = (q: Pt) => q[0];
    const [a1, a2] = sR[0] < sL[0] ? [left, right] : [right, left];
    return {
      head,
      neck: p.neck,
      hip: p.hip,
      arms: [arm(sR, p.hand, a1, p.elbow), arm(sL, p.hand2, a2, p.elbow2)],
      legs: [leg(hR, p.ankle, a1, p.knee), leg(hL, p.ankle2, a2, p.knee2)],
    };
  }
  const arms = [arm(shoulder, p.hand, elbowBackDown, p.elbow)];
  if (p.hand2) arms.push(arm(shoulder, p.hand2, elbowBackDown, p.elbow2));
  const legs = [leg(p.hip, p.ankle, kneeForward, p.knee)];
  if (p.ankle2) legs.push(leg(p.hip, p.ankle2, kneeForward, p.knee2));
  return { head, neck: p.neck, hip: p.hip, arms, legs };
}

/** Udstyr og vægte. "at" knytter tingen til et led i den aktuelle positur. */
export type Anchor = "hand" | "hand2" | "elbow" | "ankle" | "knee" | "hip" | "neck";

export type Prop =
  | { k: "line"; pts: Pt[]; w?: number }
  | { k: "rect"; x: number; y: number; w: number; h: number }
  | { k: "dumbbell"; at: Anchor }
  | { k: "plate"; at: Anchor; r?: number }
  | { k: "handle"; at: Anchor }
  | { k: "pad"; at: Anchor }
  | { k: "cable"; from: Pt; at: Anchor };

export function anchor(j: Joints, a: Anchor): Pt {
  switch (a) {
    case "hand":
      return j.arms[0].ha;
    case "hand2":
      return (j.arms[1] ?? j.arms[0]).ha;
    case "elbow":
      return j.arms[0].el;
    case "ankle":
      return j.legs[0].an;
    case "knee":
      return j.legs[0].kn;
    case "hip":
      return j.hip;
    case "neck":
      return j.neck;
  }
}
