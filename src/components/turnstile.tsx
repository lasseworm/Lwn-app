"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * Cloudflare Turnstile – CAPTCHA, der i de fleste tilfælde kører usynligt.
 * Widgetten vises kun, hvis Cloudflare har brug for, at brugeren klikker.
 *
 * Kræver NEXT_PUBLIC_TURNSTILE_SITE_KEY. Uden nøglen renderes intet, og login virker som før.
 * Den hemmelige nøgle ligger IKKE i appen, men i Supabase (Authentication → Attack Protection),
 * som selv verificerer tokenet ved login.
 */

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "auto" | "light" | "dark";
  language?: string;
  appearance?: "always" | "execute" | "interaction-only";
  action?: string;
};

type TurnstileApi = {
  render: (el: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile mangler")));
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile kunne ikke hentes"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export type TurnstileHandle = { reset: () => void };

export const Turnstile = forwardRef<
  TurnstileHandle,
  { onToken: (token: string | null) => void; onError?: () => void; action?: string }
>(function Turnstile({ onToken, onError, action }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Hold seneste callbacks uden at genstarte widgetten ved hver render
  const handlers = useRef({ onToken, onError });
  useEffect(() => {
    handlers.current = { onToken, onError };
  });

  useImperativeHandle(ref, () => ({
    reset() {
      handlers.current.onToken(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !container.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId.current = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: "auto",
          language: "da",
          appearance: "interaction-only",
          callback: (token) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onToken(null),
          "error-callback": () => {
            handlers.current.onToken(null);
            handlers.current.onError?.();
          },
        });
      })
      .catch(() => handlers.current.onError?.());
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [action]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={container} className="flex min-h-0 justify-center [&:not(:empty)]:mt-1" />;
});
