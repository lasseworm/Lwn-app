import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { t } from "@/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.login.title };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Link href="/" aria-label={t.app.fullName}>
        <Logo className="h-12" eager />
      </Link>

      <h1 className="mt-12 text-3xl font-black tracking-tight">{t.login.title}</h1>
      <p className="mt-3 text-base text-muted">{t.login.intro}</p>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error === "callback" ? t.login.errors.callback : t.login.errors.generic}
        </p>
      )}

      <LoginForm next={next} />

      <p className="mt-auto pt-10 text-center text-sm text-muted">
        {t.login.consent}{" "}
        <Link href="/privatliv" className="underline underline-offset-2">
          {t.login.privacyLink}
        </Link>
        .
      </p>
    </main>
  );
}
