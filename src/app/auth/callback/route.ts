import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Modtager brugeren efter magic link eller Google-login.
 * - `code`: PKCE-flow (standard for magic link og OAuth)
 * - `token_hash` + `type`: hvis e-mailskabelonen sender token_hash direkte
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error("exchangeCodeForSession fejlede:", error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    if (error) console.error("verifyOtp fejlede:", error.message);
  }

  const target = ok ? new URL(next, request.url) : new URL("/login?error=callback", request.url);
  return NextResponse.redirect(target);
}
