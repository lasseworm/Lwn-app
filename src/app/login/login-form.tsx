"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { t } from "@/i18n";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });
  // Når brugeren vælger "brug en anden e-mail", skjules netop dette svar.
  const [dismissed, setDismissed] = useState<LoginState | null>(null);

  if (state.status === "sent" && state !== dismissed) {
    return (
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6" role="status">
        <h2 className="text-xl font-bold">{t.login.sentTitle}</h2>
        <p className="mt-2 text-base text-muted">{t.login.sentBody(state.email)}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setDismissed(state)}>
          {t.login.tryAgain}
        </Button>
      </div>
    );
  }

  const defaultEmail = state.status === "error" ? state.email : undefined;

  return (
    <div className="mt-8 space-y-6">
      <form action={formAction} className="space-y-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="block text-sm font-semibold">
          {t.login.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          placeholder={t.login.emailPlaceholder}
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "email-error" : undefined}
          className="block min-h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
        {state.status === "error" && (
          <p id="email-error" role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t.login.sending : t.login.sendLink}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        {t.login.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary">
          <GoogleIcon />
          {t.login.google}
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
