"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { t } from "@/i18n";
import type { GenerateState } from "../program/actions";

/** 12-ugers-opdatering: nyt program, evt. med flere frie vægte */
export function ReviewForm({
  action,
  sessions,
}: {
  action: (prev: GenerateState, formData: FormData) => Promise<GenerateState>;
  sessions: number;
}) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="sessions" value={sessions} />
      <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
        <input type="checkbox" name="moreFreeWeights" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
        <span>
          <span className="block text-base font-semibold">{t.review.moreFreeWeights}</span>
          <span className="block text-sm text-muted">{t.review.moreFreeWeightsHint}</span>
        </span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t.program.generating : t.review.generate}
      </Button>
    </form>
  );
}
