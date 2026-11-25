"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { t } from "@/i18n";
import { saveProfile, type FormState } from "../program/actions";

type Defaults = { experience: string | null; goal: string | null; sessions: number; warmup: boolean };

const optionClass =
  "flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent/10";
const radioClass = "h-5 w-5 shrink-0 accent-[var(--accent)]";

export function OnboardingForm({
  defaults,
  returnTo,
  submitLabel = t.onboarding.save,
}: {
  defaults: Defaults;
  returnTo?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  return (
    <form action={action} className="space-y-8">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <fieldset className="space-y-3">
        <legend className="mb-3 text-lg font-bold">{t.onboarding.experienceQ}</legend>
        {Object.entries(t.onboarding.experience).map(([value, o]) => (
          <label key={value} className={optionClass}>
            <input type="radio" name="experience" value={value} defaultChecked={defaults.experience === value} required className={radioClass} />
            <span>
              <span className="block text-base font-semibold">{o.label}</span>
              <span className="block text-sm text-muted">{o.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-lg font-bold">{t.onboarding.goalQ}</legend>
        {Object.entries(t.onboarding.goals).map(([value, label]) => (
          <label key={value} className={optionClass}>
            <input type="radio" name="goal" value={value} defaultChecked={defaults.goal === value} required className={radioClass} />
            <span className="text-base font-semibold">{label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-lg font-bold">{t.onboarding.sessionsQ}</legend>
        {[2, 3, 4].map((n) => (
          <label key={n} className={optionClass}>
            <input type="radio" name="sessions" value={n} defaultChecked={defaults.sessions === n} required className={radioClass} />
            <span>
              <span className="block text-base font-semibold">{n} pas</span>
              <span className="block text-sm text-muted">{t.onboarding.sessionsHint[n]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className={optionClass}>
        <input type="checkbox" name="warmup" defaultChecked={defaults.warmup} className={radioClass} />
        <span className="text-base font-semibold">{t.onboarding.warmupQ}</span>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
