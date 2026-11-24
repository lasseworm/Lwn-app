"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { t } from "@/i18n";
import { createProgram, type GenerateState } from "./actions";

export function GenerateForm({ sessions, label, secondary = false }: { sessions: number; label: string; secondary?: boolean }) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(createProgram, {});
  return (
    <form action={action} className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t.program.sessionsLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((n) => (
            <label
              key={n}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border text-base font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent/15"
            >
              <input type="radio" name="sessions" value={n} defaultChecked={sessions === n} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant={secondary ? "secondary" : "primary"} disabled={pending}>
        {pending ? t.program.generating : label}
      </Button>
    </form>
  );
}
