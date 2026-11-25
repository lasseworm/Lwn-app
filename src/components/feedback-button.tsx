"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import { t } from "@/i18n";
import { sendFeedback, type FeedbackState } from "@/app/(app)/profil/actions";

/** Diskret "Giv feedback" nederst på hver side – gemmer besked + skærm i tabellen feedback */
export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Ny nøgle ved hver åbning: formularen starter altid forfra, så man kan sende flere gange
  const [round, setRound] = useState(0);

  // Træningsskærmen har sine egne knapper nederst – feedback ligger i Profil
  if (pathname.startsWith("/traening/")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRound((r) => r + 1);
          setOpen(true);
        }}
        className="mt-10 block min-h-11 w-full text-center text-sm font-semibold text-muted underline underline-offset-2"
      >
        {t.feedback.open}
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.feedback.title}
            className="w-full max-w-md space-y-4 rounded-t-3xl bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black tracking-tight">{t.feedback.title}</h2>
            <FeedbackForm key={round} pathname={pathname} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function FeedbackForm({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, {});
  if (state.sent) {
    return (
      <>
        <p role="status" className="text-base">
          ✓ {t.feedback.thanks}
        </p>
        <Button variant="secondary" onClick={onClose}>
          {t.feedback.close}
        </Button>
      </>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted">{t.feedback.intro}</p>
      <input type="hidden" name="screen" value={pathname} />
      <textarea
        name="message"
        required
        minLength={3}
        maxLength={2000}
        rows={5}
        aria-label={t.feedback.title}
        placeholder={t.feedback.placeholder}
        className="block w-full rounded-2xl border border-border bg-background p-4 text-base outline-none focus:border-accent-text"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t.feedback.send}
      </Button>
      <Button type="button" variant="secondary" onClick={onClose}>
        {t.feedback.close}
      </Button>
    </form>
  );
}
