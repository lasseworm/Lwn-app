import "server-only";

/**
 * AI-tilstand:
 * - "off":  ingen AI. Brugeren vælger selv maskintype og vægttrin (gratis).
 * - "mock": opdigtede, realistiske svar – til at teste hele flowet gratis.
 * - "live": rigtige kald til Claude API (koster tokens).
 *
 * Styres af AI_MODE. Er den ikke sat, bruges "live" hvis ANTHROPIC_API_KEY findes, ellers "off".
 */
export type AiMode = "off" | "mock" | "live";

export function aiMode(): AiMode {
  const explicit = process.env.AI_MODE?.trim().toLowerCase();
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (explicit === "mock") return "mock";
  if (explicit === "off") return "off";
  if (explicit === "live") return hasKey ? "live" : "off";
  return hasKey ? "live" : "off";
}

/** Billigste aktuelle model med billedforståelse. Kan skiftes uden kodeændring. */
export function aiModel() {
  return process.env.LWN_AI_MODEL?.trim() || "claude-haiku-5-5";
}
