import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink, Card, Logo } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.nav.home };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, machineTypes, exercises] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("machine_types").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="space-y-5">
      <header className="flex items-center justify-between">
        <Logo className="h-10" eager />
        <form action={signOut}>
          <button type="submit" className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted hover:text-foreground">
            {t.home.signOut}
          </button>
        </form>
      </header>

      <section>
        <h1 className="text-3xl font-black tracking-tight">{t.home.greeting(profile?.display_name)}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.home.signedInAs} {user.email}
        </p>
      </section>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{t.home.nextUp}</h2>
        <p className="mt-3 text-base leading-relaxed">{t.home.noProgramYet}</p>
        <Button className="mt-5" disabled>
          Start nu
        </Button>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">{t.home.catalogCard}</h2>
        <p className="mt-1 text-base text-muted">
          {t.home.catalogCount(machineTypes.count ?? 0, exercises.count ?? 0)}
        </p>
        <ButtonLink href="/katalog" variant="secondary" className="mt-5">
          {t.home.seeCatalog}
        </ButtonLink>
      </Card>
    </main>
  );
}
