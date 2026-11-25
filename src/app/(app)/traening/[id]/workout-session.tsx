"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { WeightSettings } from "@/lib/equipment/weights";
import {
  prescribe,
  stepWeight,
  warmupSets,
  type LoadType,
  type PlanTarget,
  type Prescription,
  type ProgressState,
} from "@/lib/training/progression";
import { validWeights } from "@/lib/equipment/weights";
import { muscleName, t } from "@/i18n";
import { deleteSet, finishWorkout, logSet, savePreference, updateSet } from "../actions";

export type AltOption = {
  exerciseId: string;
  name: string;
  machineTypeSlug: string;
  movementPattern: string | null;
  primaryMuscles: string[];
  isFreeWeight: boolean;
  repMin: number;
  repMax: number;
  equipmentId: string;
  settings: WeightSettings;
  load: LoadType;
  state: ProgressState | null;
  /** Signeret link til centrets eget foto af maskinen (udløber efter 1 time) */
  photoUrl: string | null;
};

export type SessionItem = {
  key: string; // program_exercise_id
  originalExerciseId: string;
  plan: PlanTarget;
  option: AltOption;
  initiallySkipped: boolean;
};

export type LoggedSet = {
  id: string;
  exerciseId: string;
  equipmentId: string;
  setIndex: number;
  weight: number | null;
  reps: number;
  completed: boolean;
  isWarmup: boolean;
  pain: boolean;
};

type Row = { id?: string; weight: number | null; reps: number; done: boolean; warmup: boolean; busy?: boolean };

type ItemState = {
  key: string;
  originalExerciseId: string;
  plan: PlanTarget;
  option: AltOption;
  prescription: Prescription;
  targetWeight: number | null;
  started: boolean; // startvægt valgt / pausevalg truffet
  rows: Row[];
  status: "active" | "skipped" | "stopped";
};

const fmtKg = (n: number | null) => (n == null ? "–" : n.toLocaleString("da-DK", { maximumFractionDigits: 2 }));

function buildRows(p: Prescription, plan: PlanTarget, weight: number | null, warmup: boolean, opt: AltOption): Row[] {
  const work: Row[] = Array.from({ length: plan.sets }, () => ({ weight, reps: p.reps, done: false, warmup: false }));
  if (!warmup || opt.load !== "weighted") return work;
  return [...warmupSets(weight, opt.settings).map((w) => ({ weight: w.weight, reps: w.reps, done: false, warmup: true })), ...work];
}

function initItem(item: SessionItem, option: AltOption, logged: LoggedSet[], warmupEnabled: boolean, now: Date): ItemState {
  const plan =
    option.exerciseId === item.option.exerciseId ? item.plan : { sets: item.plan.sets, repMin: option.repMin, repMax: option.repMax };
  const p = prescribe(option.state, plan, option.load, option.settings, now);
  const mine = logged.filter((s) => s.exerciseId === option.exerciseId && s.equipmentId === option.equipmentId);
  const pain = mine.some((s) => s.pain);
  const workLogged = mine.filter((s) => !s.isWarmup && !s.pain);

  let targetWeight = p.weight;
  let started = !p.needsStartWeight && !p.pause;
  if (workLogged.length > 0) {
    targetWeight = workLogged[0].weight;
    started = true;
  }

  let rows = buildRows(p, plan, targetWeight, warmupEnabled && started, option);
  // Læg allerede gemte sæt ind på deres pladser (genoptaget pas)
  const warm = mine.filter((s) => s.isWarmup && !s.pain);
  const warmRows = rows.filter((r) => r.warmup);
  const workRows = rows.filter((r) => !r.warmup);
  warm.forEach((s, i) => {
    const r = warmRows[i] ?? { warmup: true, weight: s.weight, reps: s.reps, done: false };
    Object.assign(r, { id: s.id, weight: s.weight, reps: s.reps, done: true });
    if (!warmRows[i]) warmRows.push(r);
  });
  workLogged.forEach((s, i) => {
    const r = workRows[i] ?? { warmup: false, weight: s.weight, reps: s.reps, done: false };
    Object.assign(r, { id: s.id, weight: s.weight, reps: s.reps, done: true });
    if (!workRows[i]) workRows.push(r);
  });
  rows = [...warmRows, ...workRows];

  return {
    key: item.key,
    originalExerciseId: item.originalExerciseId,
    plan,
    option,
    prescription: p,
    targetWeight,
    started,
    rows,
    status: pain ? "stopped" : item.initiallySkipped && mine.length === 0 ? "skipped" : "active",
  };
}

// "Progression virkede ikke" huskes i browseren under passet (sendes til serveren ved afslutning)
function useStoredHolds(workoutId: string) {
  const key = `lwn-hold-${workoutId}`;
  const read = () => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  };
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener("lwn-hold", cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener("lwn-hold", cb);
      };
    },
    read,
    () => "",
  );
  const holds = useMemo(() => new Set(raw ? raw.split(",") : []), [raw]);
  const toggle = (itemKey: string) => {
    const next = new Set(holds);
    if (next.has(itemKey)) next.delete(itemKey);
    else next.add(itemKey);
    try {
      localStorage.setItem(key, [...next].join(","));
    } catch {
      /* privat tilstand: flaget gælder kun til siden genindlæses */
    }
    window.dispatchEvent(new Event("lwn-hold"));
  };
  return { holds, toggle };
}

export function WorkoutSession({
  workoutId,
  title,
  items,
  pool,
  logged,
  warmupEnabled,
  nowIso,
}: {
  workoutId: string;
  title: string;
  items: SessionItem[];
  pool: AltOption[];
  logged: LoggedSet[];
  warmupEnabled: boolean;
  nowIso: string;
}) {
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const { holds, toggle: toggleHold } = useStoredHolds(workoutId);

  const [state, setState] = useState<ItemState[]>(() => {
    // Sæt fra et alternativ, der ikke er i programmet (genoptaget pas efter et skift), knyttes til den øvelse, de erstattede
    const used = new Set<string>();
    const unmatched = new Map<string, LoggedSet[]>();
    for (const s of logged) {
      const inProgram = items.some((i) => i.option.exerciseId === s.exerciseId && i.option.equipmentId === s.equipmentId);
      if (!inProgram) unmatched.set(`${s.exerciseId}|${s.equipmentId}`, [...(unmatched.get(`${s.exerciseId}|${s.equipmentId}`) ?? []), s]);
    }
    return items.map((item) => {
      let option = item.option;
      const ownLogged = logged.some((s) => s.exerciseId === option.exerciseId && s.equipmentId === option.equipmentId);
      if (!ownLogged) {
        for (const k of unmatched.keys()) {
          if (used.has(k)) continue;
          const alt = pool.find((o) => `${o.exerciseId}|${o.equipmentId}` === k);
          if (alt && (alt.movementPattern === option.movementPattern || alt.primaryMuscles.some((m) => option.primaryMuscles.includes(m)))) {
            option = alt;
            used.add(k);
            break;
          }
        }
      }
      return initItem(item, option, logged, warmupEnabled, now);
    });
  });

  const firstOpen = state.findIndex((s) => s.status === "active" && s.rows.some((r) => !r.done && !r.warmup));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | { kind: "alt"; reason: string } | { kind: "pain" }>(null);
  const [finishing, startFinish] = useTransition();

  const cur = state[index];
  const update = (fn: (s: ItemState) => ItemState) => setState((all) => all.map((s, i) => (i === index ? fn(s) : s)));
  const updateRow = (ri: number, patch: Partial<Row>) =>
    update((s) => ({ ...s, rows: s.rows.map((r, i) => (i === ri ? { ...r, ...patch } : r)) }));

  if (!cur) {
    return (
      <main className="space-y-5">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-base text-muted">{t.program.tooLittleEquipment}</p>
      </main>
    );
  }

  const opt = cur.option;
  const setNumberOf = (ri: number) => cur.rows.slice(0, ri + 1).filter((r) => !r.warmup).length;

  async function toggleRow(ri: number) {
    const r = cur.rows[ri];
    if (r.busy) return;
    setError(null);
    updateRow(ri, { busy: true });
    if (!r.done) {
      const res = await logSet(workoutId, {
        exerciseId: opt.exerciseId,
        equipmentId: opt.equipmentId,
        setIndex: ri,
        weight: opt.load === "bodyweight" ? null : r.weight,
        reps: r.reps,
        isWarmup: r.warmup,
      });
      if ("id" in res) updateRow(ri, { id: res.id, done: true, busy: false });
      else {
        updateRow(ri, { busy: false });
        setError(t.workout.errors.generic);
      }
    } else if (r.id) {
      const res = await deleteSet(workoutId, r.id);
      if ("ok" in res) updateRow(ri, { id: undefined, done: false, busy: false });
      else {
        updateRow(ri, { busy: false });
        setError(t.workout.errors.generic);
      }
    }
  }

  function changeRow(ri: number, patch: { weight?: number | null; reps?: number }) {
    const r = cur.rows[ri];
    const next = { ...r, ...patch };
    updateRow(ri, patch);
    // Rettet efter "udført": gem rettelsen med det samme
    if (r.done && r.id) void updateSet(workoutId, r.id, next.weight, next.reps);
  }

  /** Sæt målvægt for alle ikke-udførte sæt (startvægt eller pausevalg) */
  function chooseWeight(w: number) {
    update((s) => {
      const doneRows = s.rows.filter((r) => r.done);
      const rows = doneRows.length ? s.rows.map((r) => (r.done ? r : { ...r, weight: r.warmup ? r.weight : w })) : buildRows(s.prescription, s.plan, w, warmupEnabled, s.option);
      return { ...s, targetWeight: w, started: true, rows };
    });
  }

  function swapTo(o: AltOption) {
    update((s) => {
      // Alternativet får sit eget rep-interval, men beholder antal sæt fra programmet
      const plan = { sets: s.plan.sets, repMin: o.repMin, repMax: o.repMax };
      return initItem({ key: s.key, originalExerciseId: s.originalExerciseId, plan, option: o, initiallySkipped: false }, o, [], warmupEnabled, now);
    });
  }

  async function confirmPain() {
    setSheet(null);
    const res = await logSet(workoutId, {
      exerciseId: opt.exerciseId,
      equipmentId: opt.equipmentId,
      setIndex: 99,
      weight: null,
      reps: 0,
      isWarmup: false,
      pain: true,
    });
    if ("error" in res) return setError(t.workout.errors.generic);
    update((s) => ({ ...s, status: "stopped" }));
    if (index < state.length - 1) setIndex(index + 1);
  }

  function finish() {
    if (!window.confirm(t.workout.finishConfirm)) return;
    startFinish(async () => {
      const res = await finishWorkout(
        workoutId,
        state
          .filter((s) => s.status !== "skipped")
          .map((s) => ({
            programExerciseId: s.key,
            exerciseId: s.option.exerciseId,
            equipmentId: s.option.equipmentId,
            targetWeight: s.targetWeight,
            progressionDidNotWork: holds.has(s.key),
          })),
      );
      if ("error" in res) return setError(t.workout.errors.generic);
      try {
        localStorage.removeItem(`lwn-hold-${workoutId}`);
      } catch {
        /* ignorér */
      }
      router.refresh();
    });
  }

  const hold = holds.has(cur.key);
  const p = cur.prescription;
  const showWeight = opt.load !== "bodyweight";
  const weightsList = validWeights(
    opt.settings.weight_step_kg ? opt.settings : { ...opt.settings, weight_step_kg: 2.5, min_weight_kg: opt.settings.min_weight_kg ?? 2.5 },
  );

  return (
    <main className="space-y-4">
      {/* -------------------------------------------------------------- Oversigt */}
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">{title}</p>
        <nav aria-label="Øvelser" className="mt-3 flex gap-1.5">
          {state.map((s, i) => {
            const allDone = s.rows.filter((r) => !r.warmup).every((r) => r.done);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. ${s.option.name}`}
                aria-current={i === index ? "step" : undefined}
                className={`h-2.5 flex-1 rounded-full ${
                  i === index ? "bg-foreground" : s.status !== "active" ? "bg-border" : allDone ? "bg-accent" : "bg-border/70 ring-1 ring-border"
                }`}
              />
            );
          })}
        </nav>
        <p className="mt-2 text-sm text-muted">{t.workout.exerciseOf(index + 1, state.length)}</p>
      </header>

      {/* -------------------------------------------------------------- Øvelse */}
      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black leading-tight tracking-tight">{opt.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {opt.primaryMuscles.map(muscleName).join(", ")} ·{" "}
              <Link href={`/katalog/${opt.machineTypeSlug}`} className="font-semibold underline underline-offset-2">
                {t.workout.instructions}
              </Link>
            </p>
          </div>
          {opt.photoUrl && (
            <a href={opt.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- signeret URL, udløber efter 1 time */}
              <img src={opt.photoUrl} alt={t.workout.machinePhoto} className="size-24 rounded-xl bg-background object-cover" />
            </a>
          )}
        </div>

        {cur.status === "stopped" ? (
          <p role="status" className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
            {t.workout.stopped}. {t.workout.painText}
          </p>
        ) : cur.status === "skipped" ? (
          <p className="text-base text-muted">{t.workout.skipped}</p>
        ) : (
          <>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t.workout.target}</p>
              <p className="mt-1 text-2xl font-black tracking-tight">
                {cur.plan.sets} × {p.reps}
                {showWeight && cur.targetWeight != null && ` · ${fmtKg(cur.targetWeight)} kg`}
                {!showWeight && ` · ${t.workout.bodyweight}`}
              </p>
              {p.fromHold && <p className="mt-1 text-sm text-muted">{t.workout.holdNote}</p>}
            </div>

            {/* Startvægt første gang */}
            {!cur.started && p.needsStartWeight && (
              <StartWeightPicker
                weights={weightsList}
                assisted={opt.load === "assisted"}
                onChoose={chooseWeight}
              />
            )}

            {/* Pause: foreslå lettere start */}
            {!cur.started && !p.needsStartWeight && p.pause && (
              <div className="space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-4">
                <p className="text-base font-bold">{t.workout.pauseTitle(p.pause.days)}</p>
                <p className="text-sm">{t.workout.pauseText}</p>
                {p.pause.suggestedWeight != null && (
                  <Button onClick={() => chooseWeight(p.pause!.suggestedWeight!)}>{t.workout.pauseLighter(fmtKg(p.pause.suggestedWeight))}</Button>
                )}
                <Button variant="secondary" onClick={() => (p.weight != null ? chooseWeight(p.weight) : update((s) => ({ ...s, started: true })))}>
                  {t.workout.pauseKeep(fmtKg(p.weight))}
                </Button>
              </div>
            )}

            {/* Sæt */}
            {cur.started && (
              <ol className="space-y-2">
                {cur.rows.map((r, ri) => {
                  const label = r.warmup ? t.workout.warmup : t.workout.set(setNumberOf(ri));
                  return (
                    <li key={ri} className={`rounded-2xl border p-2 ${r.done ? "border-accent/50 bg-accent/10" : "border-border"}`}>
                      <span className="mb-1 block px-1 text-xs font-semibold text-muted">{label}</span>
                      <div className="flex items-center gap-2">
                        {showWeight && (
                          <Stepper
                            label={t.workout.kg}
                            value={fmtKg(r.weight)}
                            onMinus={() => changeRow(ri, { weight: stepWeight(r.weight, -1, opt.settings) })}
                            onPlus={() => changeRow(ri, { weight: stepWeight(r.weight, 1, opt.settings) })}
                          />
                        )}
                        <Stepper
                          label={t.workout.reps}
                          value={String(r.reps)}
                          onMinus={() => changeRow(ri, { reps: Math.max(0, r.reps - 1) })}
                          onPlus={() => changeRow(ri, { reps: Math.min(100, r.reps + 1) })}
                        />
                        <button
                          type="button"
                          onClick={() => void toggleRow(ri)}
                          disabled={r.busy}
                          aria-pressed={r.done}
                          aria-label={r.done ? `${t.workout.undo}: ${label}` : `${t.workout.done}: ${label}`}
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                            r.done ? "border-accent bg-accent text-accent-foreground" : "border-border"
                          } disabled:opacity-50`}
                        >
                          <Check aria-hidden size={24} strokeWidth={3} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Handlinger */}
            <div className="grid grid-cols-2 gap-2">
              <SmallButton onClick={() => setSheet({ kind: "alt", reason: "dislike" })}>{t.workout.findAlternative}</SmallButton>
              <SmallButton onClick={() => setSheet({ kind: "alt", reason: "occupied" })}>{t.workout.occupied}</SmallButton>
              <SmallButton onClick={() => setSheet({ kind: "pain" })} danger>
                {t.workout.pain}
              </SmallButton>
              <SmallButton onClick={() => toggleHold(cur.key)} pressed={hold}>
                {t.workout.progressionDidNotWork}
              </SmallButton>
            </div>
            {hold && (
              <p role="status" className="text-sm text-muted">
                ✓ {t.workout.progressionDidNotWorkOn}
              </p>
            )}
          </>
        )}
      </Card>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {/* -------------------------------------------------------------- Navigation */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          {t.workout.prev}
        </Button>
        {index < state.length - 1 ? (
          <Button variant="dark" onClick={() => setIndex(index + 1)}>
            {t.workout.nextExercise}
          </Button>
        ) : (
          <Button onClick={finish} disabled={finishing}>
            {finishing ? t.workout.finishing : t.workout.finish}
          </Button>
        )}
      </div>
      {index < state.length - 1 && (
        <button type="button" onClick={finish} disabled={finishing} className="min-h-12 w-full text-sm font-semibold text-muted underline underline-offset-2">
          {finishing ? t.workout.finishing : t.workout.finish}
        </button>
      )}

      {/* -------------------------------------------------------------- Ark */}
      {sheet?.kind === "pain" && (
        <Sheet title={t.workout.painTitle} onClose={() => setSheet(null)}>
          <p className="text-base leading-relaxed">{t.workout.painText}</p>
          <Button variant="dark" onClick={() => void confirmPain()}>
            {t.workout.painConfirm}
          </Button>
          <Button variant="secondary" onClick={() => setSheet(null)}>
            {t.workout.cancel}
          </Button>
        </Sheet>
      )}
      {sheet?.kind === "alt" && (
        <AlternativesSheet
          current={opt}
          pool={pool.filter((o) => !state.some((s, i) => i !== index && s.option.exerciseId === o.exerciseId))}
          initialReason={sheet.reason}
          onClose={() => setSheet(null)}
          onPick={async (o, reason, remember) => {
            setSheet(null);
            if (remember) await savePreference({ originalExerciseId: cur.originalExerciseId, replacementExerciseId: o.exerciseId, excluded: false, reason });
            swapTo(o);
          }}
          onSkip={async (reason, remember) => {
            setSheet(null);
            if (remember) await savePreference({ originalExerciseId: cur.originalExerciseId, replacementExerciseId: null, excluded: true, reason });
            update((s) => ({ ...s, status: "skipped" }));
            if (index < state.length - 1) setIndex(index + 1);
          }}
        />
      )}
    </main>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <button type="button" onClick={onMinus} aria-label={`${label} minus`} className="flex h-12 w-9 shrink-0 items-center justify-center rounded-l-xl bg-background">
        <Minus aria-hidden size={18} />
      </button>
      <span className="flex h-12 min-w-0 flex-1 flex-col items-center justify-center bg-background leading-none">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        <span className="text-[10px] font-semibold uppercase text-muted">{label}</span>
      </span>
      <button type="button" onClick={onPlus} aria-label={`${label} plus`} className="flex h-12 w-9 shrink-0 items-center justify-center rounded-r-xl bg-background">
        <Plus aria-hidden size={18} />
      </button>
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  danger,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`min-h-12 rounded-xl border px-3 text-sm font-semibold ${
        danger ? "border-danger/50 text-danger" : pressed ? "border-accent bg-accent/15" : "border-border"
      }`}
    >
      {children}
    </button>
  );
}

function StartWeightPicker({ weights, assisted, onChoose }: { weights: number[]; assisted: boolean; onChoose: (w: number) => void }) {
  // Assisteret: start med rigeligt hjælp (midt i stakken); ellers den letteste vægt
  const [i, setI] = useState(assisted ? Math.floor(weights.length / 2) : 0);
  const w = weights[i] ?? 0;
  return (
    <div className="space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-4">
      <p className="text-base font-bold">{t.workout.startWeightTitle}</p>
      <p className="text-sm">{assisted ? t.workout.assistedHint : t.workout.startWeightHint}</p>
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => setI(Math.max(0, i - 1))} aria-label="Lettere" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <Minus aria-hidden />
        </button>
        <span className="min-w-24 text-center text-3xl font-black tabular-nums">{fmtKg(w)} kg</span>
        <button type="button" onClick={() => setI(Math.min(weights.length - 1, i + 1))} aria-label="Tungere" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <Plus aria-hidden />
        </button>
      </div>
      <Button onClick={() => onChoose(w)}>{t.workout.useWeight(fmtKg(w))}</Button>
    </div>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function AlternativesSheet({
  current,
  pool,
  initialReason,
  onClose,
  onPick,
  onSkip,
}: {
  current: AltOption;
  pool: AltOption[];
  initialReason: string;
  onClose: () => void;
  onPick: (o: AltOption, reason: string, remember: boolean) => void;
  onSkip: (reason: string, remember: boolean) => void;
}) {
  const [reason, setReason] = useState(initialReason);
  // En optaget maskine er typisk midlertidig – derfor huskes valget ikke som standard
  const [remember, setRemember] = useState(initialReason !== "occupied");

  // Samme bevægelse først, derefter samme muskler. Maskiner før frie vægte.
  const options = pool
    .filter((o) => o.exerciseId !== current.exerciseId)
    .map((o) => ({
      o,
      score:
        (o.movementPattern === current.movementPattern ? 0 : o.primaryMuscles.some((m) => current.primaryMuscles.includes(m)) ? 1 : 9) * 10 +
        (o.isFreeWeight ? 1 : 0) +
        (reason === "occupied" && o.machineTypeSlug === current.machineTypeSlug ? 5 : 0),
    }))
    .filter((x) => x.score < 90)
    .sort((a, b) => a.score - b.score || a.o.name.localeCompare(b.o.name, "da"))
    .slice(0, 8)
    .map((x) => x.o);

  return (
    <Sheet title={t.workout.alternativesTitle} onClose={onClose}>
      <p className="text-sm text-muted">{t.workout.alternativesIntro}</p>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t.workout.reasonLabel}</legend>
        <div className="grid gap-2">
          {Object.entries(t.workout.reasons).map(([value, label]) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="reason"
                value={value}
                checked={reason === value}
                onChange={() => {
                  setReason(value);
                  setRemember(value !== "occupied");
                }}
                className="h-5 w-5 accent-[var(--accent)]"
              />
              <span className="text-sm font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
        <span className="text-sm font-semibold">{t.workout.remember}</span>
      </label>
      {options.length === 0 ? (
        <p className="text-base text-muted">{t.workout.noAlternatives}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {options.map((o) => (
            <li key={o.exerciseId} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-base font-semibold">{o.name}</span>
                <span className="block text-sm text-muted">{o.primaryMuscles.map(muscleName).join(", ")}</span>
              </span>
              <button
                type="button"
                onClick={() => onPick(o, reason, remember)}
                className="min-h-11 shrink-0 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
              >
                {t.workout.useThis}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onClick={() => onSkip(reason, remember)}>
        {t.workout.skipExercise}
      </Button>
    </Sheet>
  );
}
