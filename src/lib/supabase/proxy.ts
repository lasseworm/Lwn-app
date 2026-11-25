import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Stier der kan ses uden login. Alt andet kræver login. */
const PUBLIC_PATHS = ["/", "/login", "/privatliv", "/api/stripe/webhook"];
const PUBLIC_PREFIXES = ["/auth/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Fornyer Supabase-sessionen ved hver forespørgsel og beskytter sider bag login.
 * Baseret på Supabases officielle mønster for @supabase/ssr.
 */
export async function updateSession(request: NextRequest) {
  // Sikkerhedsnet: Er login-adressen ikke godkendt i Supabase (Authentication → URL
  // Configuration → Redirect URLs), sender Supabase brugeren til Site URL – forsiden –
  // med login-koden i adressen. Send den videre til /auth/callback, så login gennemføres.
  if (request.nextUrl.pathname === "/") {
    const params = request.nextUrl.searchParams;
    if (params.has("code") || (params.has("token_hash") && params.has("type"))) {
      const target = request.nextUrl.clone();
      target.pathname = "/auth/callback";
      if (!target.searchParams.has("next")) target.searchParams.set("next", "/hjem");
      return NextResponse.redirect(target);
    }
    if (params.has("error_description")) {
      const target = request.nextUrl.clone();
      target.pathname = "/login";
      target.search = "?error=callback";
      return NextResponse.redirect(target);
    }
  }

  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Vigtigt: kald getUser() direkte efter createServerClient – det fornyer tokenet.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";
    for (const [k, v] of Object.entries(params ?? {})) target.searchParams.set(k, v);
    const redirect = NextResponse.redirect(target);
    // Bevar evt. fornyede session-cookies
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && pathname.startsWith("/api/") && !isPublic(pathname)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!user && !isPublic(pathname)) {
    return redirectTo("/login", { next: pathname + search });
  }

  if (user && (pathname === "/" || pathname === "/login")) {
    return redirectTo("/hjem");
  }

  return response;
}
