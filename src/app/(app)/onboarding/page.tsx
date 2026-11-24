import type { Metadata } from "next";
import { requireUser } from "@/lib/gyms";
import { t } from "@/i18n";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: t.onboarding.title };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("experience_level, goal, sessions_per_week, warmup_enabled")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t.onboarding.title}</h1>
        <p className="mt-2 text-base text-muted">{t.onboarding.intro}</p>
      </header>
      <OnboardingForm
        defaults={{
          experience: profile?.experience_level ?? null,
          goal: profile?.goal ?? null,
          sessions: profile?.sessions_per_week ?? 3,
          warmup: profile?.warmup_enabled ?? false,
        }}
      />
    </main>
  );
}
