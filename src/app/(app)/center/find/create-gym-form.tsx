"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { t } from "@/i18n";
import { createGym, type CreateGymState } from "../actions";

export function CreateGymForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<CreateGymState, FormData>(createGym, {});
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="gym-name" className="block text-sm font-semibold">
        {t.gym.nameLabel}
      </label>
      <input id="gym-name" name="name" required minLength={2} maxLength={80} defaultValue={defaultName} className={inputClass} />
      <label htmlFor="gym-city" className="block text-sm font-semibold">
        {t.gym.cityLabel}
      </label>
      <input id="gym-city" name="city" required minLength={2} maxLength={80} className={inputClass} autoComplete="address-level2" />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t.gym.create}
      </Button>
    </form>
  );
}
