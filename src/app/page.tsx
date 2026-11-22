import { ButtonLink, Logo } from "@/components/ui";
import { t } from "@/i18n";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <Logo className="text-3xl" />

      <div className="mt-auto pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t.app.tagline}</p>
        <h1 className="mt-3 text-5xl font-black leading-[1.02] tracking-tight">
          Learn.
          <br />
          Workout.
          <br />
          Never Quit<span className="text-accent">.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{t.welcome.lead}</p>

        <ul className="mt-6 space-y-2">
          {t.welcome.points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-base">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 space-y-3">
        <ButtonLink href="/login">{t.welcome.start}</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          {t.welcome.haveAccount}
        </ButtonLink>
      </div>
    </main>
  );
}
