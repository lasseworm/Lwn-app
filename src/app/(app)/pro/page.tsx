import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink, Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n";
import { openPortal, startCheckout } from "./actions";

export const metadata: Metadata = { title: t.pro.title };

export default async function ProPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro");

  const [{ status }, { data: sub }, { data: limits }] = await Promise.all([
    searchParams,
    // RLS: brugeren kan kun læse sit eget abonnement
    supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end").maybeSingle(),
    supabase.from("plan_limits").select("plan, feature, period, max_uses"),
  ]);

  const isPro = !!sub && ["active", "trialing"].includes(sub.status);
  const hasCustomer = !!sub && sub.status !== "inactive";
  const limit = (plan: "free" | "pro", feature: string) =>
    limits?.find((l) => l.plan === plan && l.feature === feature)?.max_uses ?? 0;
  const until = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("da-DK", { day: "numeric", month: "long" })
    : null;

  return (
    <main className="space-y-5">
      <BackLink href="/hjem" label={t.nav.home} />

      <section>
        <h1 className="text-3xl font-black tracking-tight">{t.pro.title}</h1>
        <p className="mt-1 text-base text-muted">{t.pro.lead}</p>
      </section>

      {status === "velkommen" && (
        <Card className="border-accent-text">
          <p className="text-base font-semibold">{t.pro.welcome}</p>
        </Card>
      )}

      {isPro && sub ? (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.pro.yourPlan}</h2>
          <p className="mt-2 text-2xl font-black tracking-tight">
            {sub.status === "trialing" ? t.pro.trialing : t.pro.active}
          </p>
          {until && (
            <p className="text-base text-muted">
              {sub.cancel_at_period_end ? t.pro.endsOn(until) : t.pro.renewsOn(until)}
            </p>
          )}
          <form action={openPortal} className="mt-5">
            <Button type="submit" variant="secondary">
              {t.pro.manage}
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <p className="text-3xl font-black tracking-tight">{t.pro.price}</p>
          <ul className="mt-4 space-y-2 text-base">
            {t.pro.features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
          <form action={startCheckout} className="mt-5">
            <Button type="submit">{hasCustomer ? t.pro.subscribe : t.pro.startTrial}</Button>
          </form>
          <p className="mt-3 text-sm text-muted">{t.pro.cancelAnytime}</p>
          {sub?.status === "past_due" && (
            <form action={openPortal} className="mt-3">
              <Button type="submit" variant="secondary">
                {t.pro.fixPayment}
              </Button>
            </form>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold">{t.pro.freeTitle}</h2>
        <ul className="mt-3 space-y-2 text-base text-muted">
          <li>{t.pro.freeRecognitions(limit("free", "machine_recognition"))}</li>
          <li>{t.pro.freePrograms(limit("free", "starter_program"))}</li>
          <li>{t.pro.freeLogging}</li>
        </ul>
      </Card>
    </main>
  );
}
