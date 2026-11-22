import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Supabase-klient til Server Components, Server Actions og Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Kaldt fra en Server Component, hvor cookies ikke kan sættes.
          // Det er ok: proxy.ts fornyer sessionen ved hver forespørgsel.
        }
      },
    },
  });
}

/** Den indloggede bruger (verificeret mod Supabase Auth), eller null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
