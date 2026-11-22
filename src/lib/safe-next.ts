/** Tillad kun interne stier som redirect-mål (beskytter mod open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/hjem") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
