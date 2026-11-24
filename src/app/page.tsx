import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui";
import { t } from "@/i18n";

// Hero-billedet vises kun, hvis public/images/hero.jpg findes (tjekkes ved build).
const HERO_IMAGE = "/images/hero.jpg";
const hasHeroImage = fs.existsSync(path.join(process.cwd(), "public", HERO_IMAGE));

const FEATURE_ICONS: Record<string, LucideIcon> = {
  learn: BookOpen,
  start: Dumbbell,
  progress: TrendingUp,
};

export default function WelcomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ------------------------------------------------------------ Hero (mørk i både lys og mørk tilstand) */}
      <section className="relative isolate overflow-hidden bg-[#111214] text-white">
        {hasHeroImage ? (
          <>
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              className="-z-20 object-cover object-center"
            />
            {/* Mørk toning, så teksten altid kan læses oven på billedet */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-[#111214] via-[#111214]/80 to-[#111214]/30 md:bg-gradient-to-r md:from-[#111214] md:via-[#111214]/85 md:to-[#111214]/10"
            />
          </>
        ) : (
          // Rolig mørk baggrund med en diskret orange diagonal stribe, der tones ud i top og bund
          <div
            aria-hidden
            className="absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_65%,transparent)]"
          >
            <div className="absolute -right-32 -top-1/4 h-[160%] w-40 rotate-[28deg] bg-[#ff8a00]/[0.12] md:right-[10%] md:w-56" />
            <div className="absolute -right-10 -top-1/4 h-[160%] w-1.5 rotate-[28deg] bg-[#ff8a00]/50 md:right-[26%] md:w-2" />
          </div>
        )}

        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-14 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-10 md:pb-24 md:pt-8">
          <header>
            <Logo onDark eager className="h-12 md:h-14" />
          </header>

          <div className="max-w-xl pt-14 md:pt-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#b8b8b8]">{t.app.tagline}</p>
            <h1 className="mt-3 text-6xl font-extrabold leading-[0.95] tracking-tight md:text-8xl">
              Learn.
              <br />
              Workout.
              <br />
              Never Quit<span className="text-[#ff8a00]">.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#b8b8b8] md:text-xl">{t.welcome.lead}</p>

            <div className="mt-10 grid gap-3 sm:max-w-md">
              <Link
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#ff8a00] px-6 text-base font-semibold text-[#111214] transition hover:brightness-105 active:scale-[0.99]"
              >
                {t.welcome.start}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
              >
                {t.welcome.haveAccount}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Learn / Get started / Keep progressing */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-20">
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {t.welcome.features.map((f) => {
            const Icon = FEATURE_ICONS[f.key] ?? Dumbbell;
            return (
              <li key={f.key} className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                  <Icon aria-hidden className="h-6 w-6 text-accent-text" strokeWidth={2.25} />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold tracking-wide">{f.title}</h2>
                <p className="mt-2 text-base leading-relaxed">{f.text}</p>
                <p className="mt-3 text-sm font-semibold text-accent-text">{f.benefit}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <Logo className="h-10" />
          <p className="text-sm text-muted">
            {t.app.fullName} ·{" "}
            <Link href="/privatliv" className="underline underline-offset-2">
              {t.welcome.privacy}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
