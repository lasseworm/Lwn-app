"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { t } from "@/i18n";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <p className="text-sm leading-relaxed">{t.profile.deleteText}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.profile.deleteConfirmLabel}</span>
        <input name="confirm" autoComplete="off" autoCapitalize="characters" className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="secondary" className="border-danger/50 text-danger" disabled={pending}>
        {t.profile.deleteButton}
      </Button>
    </form>
  );
}
