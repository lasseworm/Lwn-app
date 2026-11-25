import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/gyms";
import { signOut } from "@/app/login/actions";
import { t } from "@/i18n";
import { OnboardingForm } from "../onboarding/onboarding-form";
import { removePreference } from "./actions";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: t.profile.title };

export default async function ProfilePage(props: PageProps<"/profil">) {
  const sp = await props.searchParams;
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: prefs }, { data: gyms }] = await Promise.all([
    supabase.from("profiles").select("display_name, experience_level, goal, sessions_per_week, warmup_enabled, active_gym_id").eq("id", user.id).maybeSingle(),
    supabase
      .from("exercise_preferences")
      .select("original_exercise_id, excluded, reason, original:exercises!exercise_preferences_original_exercise_id_fkey(name), replacement:exercises!exercise_preferences_replacement_exercise_id_fkey(name)")
      .eq("user_id", user.id),
    supabase.from("user_gyms").select("gyms(id, name, city)").eq("user_id", user.id),
  ]);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {profile?.display_name ? `${profile.display_name} · ` : ""}
          {user.email}
        </p>
      </header>

      {/* Mine oplysninger */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t.profile.details}</h2>
        {sp.gemt === "1" && (
          <p role="status" className="rounded-2xl border border-accent/50 bg-accent/10 p-3 text-sm">
            ✓ {t.profile.saved}
          </p>
        )}
        <details className="rounded-2xl border border-border bg-surface p-4">
          <summary className="min-h-11 cursor-pointer content-center text-base font-semibold">
            {[
              profile?.experience_level ? t.onboarding.experience[profile.experience_level]?.label : null,
              profile?.goal ? t.onboarding.goals[profile.goal] : null,
              profile?.sessions_per_week ? `${profile.sessions_per_week} pas/uge` : null,
            ]
              .filter(Boolean)
              .join(" · ") || t.onboarding.title}
          </summary>
          <div className="mt-4">
            <OnboardingForm
              returnTo="/profil"
              submitLabel={t.profile.save}
              defaults={{
                experience: profile?.experience_level ?? null,
                goal: profile?.goal ?? null,
                sessions: profile?.sessions_per_week ?? 3,
                warmup: profile?.warmup_enabled ?? false,
              }}
            />
          </div>
        </details>
      </section>

      {/* Mine alternativer */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t.profile.preferences}</h2>
        {(prefs ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t.profile.preferencesEmpty}</p>
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {(prefs ?? []).map((p) => (
                <li key={p.original_exercise_id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold">{p.original?.name}</span>
                    <span className="block text-sm text-muted">
                      {p.excluded ? t.profile.excluded : t.profile.replacedBy(p.replacement?.name ?? "–")}
                      {p.reason && t.workout.reasons[p.reason] ? ` · ${t.workout.reasons[p.reason]}` : ""}
                    </span>
                  </span>
                  <form action={removePreference}>
                    <input type="hidden" name="exerciseId" value={p.original_exercise_id} />
                    <button type="submit" className="min-h-11 shrink-0 rounded-xl border border-border px-3 text-sm font-semibold">
                      {t.profile.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* Mine centre */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t.profile.gyms}</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {(gyms ?? [])
              .map((g) => g.gyms)
              .filter((g): g is NonNullable<typeof g> => !!g)
              .map((g) => (
                <li key={g.id} className="flex items-center justify-between px-5 py-3">
                  <span>
                    <span className="block text-base font-semibold">{g.name}</span>
                    <span className="block text-sm text-muted">{g.city}</span>
                  </span>
                  {g.id === profile?.active_gym_id && <span className="text-sm font-semibold text-accent-text">{t.gym.active}</span>}
                </li>
              ))}
            <li>
              <NavRow href="/center/find" label={t.profile.manageGyms} />
            </li>
          </ul>
        </Card>
      </section>

      {/* Mere */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t.profile.more}</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            <li>
              <NavRow href="/pro" label={t.pro.title} />
            </li>
            <li>
              <NavRow href="/tips" label={t.tips.title} />
            </li>
            <li>
              <NavRow href="/katalog" label={t.catalog.title} />
            </li>
            <li>
              <NavRow href="/privatliv" label={t.welcome.privacy} />
            </li>
          </ul>
        </Card>
      </section>

      {/* Mine data (GDPR) */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t.profile.data}</h2>
        <Card className="space-y-3">
          <h3 className="text-base font-bold">{t.profile.exportTitle}</h3>
          <p className="text-sm text-muted">{t.profile.exportText}</p>
          {/* Almindeligt link (ikke klient-navigation), så browseren downloader filen */}
          <a
            href="/api/export"
            download
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border px-5 text-base font-semibold"
          >
            {t.profile.exportButton}
          </a>
        </Card>
        <details className="rounded-2xl border border-danger/40 bg-surface p-4">
          <summary className="min-h-11 cursor-pointer content-center text-base font-bold text-danger">{t.profile.deleteTitle}</summary>
          <DeleteAccountForm />
        </details>
      </section>

      <form action={signOut}>
        <button type="submit" className="min-h-12 w-full rounded-2xl border border-border text-base font-semibold">
          {t.profile.signOut}
        </button>
      </form>
    </main>
  );
}

function NavRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between px-5 text-base font-semibold">
      {label}
      <ChevronRight aria-hidden size={18} className="text-muted" />
    </Link>
  );
}
