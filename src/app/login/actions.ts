"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";
import { safeNext } from "@/lib/safe-next";
import { t } from "@/i18n";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function callbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: t.login.errors.invalidEmail, email };
  }

  // Token fra Cloudflare Turnstile. Supabase verificerer det selv, når CAPTCHA er slået til
  // under Authentication → Attack Protection. Er det slået fra, ignoreres det.
  const captchaToken = String(formData.get("captchaToken") ?? "").trim() || undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl(await getOrigin(), next),
      shouldCreateUser: true,
      captchaToken,
    },
  });

  if (error) {
    const rateLimited = error.status === 429 || /rate limit/i.test(error.message);
    const captchaFailed = /captcha/i.test(error.message);
    console.error("signInWithOtp fejlede:", error.message);
    return {
      status: "error",
      message: captchaFailed
        ? t.login.errors.captcha
        : rateLimited
          ? t.login.errors.rateLimited
          : t.login.errors.generic,
      email,
    };
  }

  return { status: "sent", email };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(await getOrigin(), next) },
  });

  if (error || !data.url) {
    console.error("signInWithOAuth fejlede:", error?.message);
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
