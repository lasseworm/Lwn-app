import { da, type Dictionary } from "./da";

/** Aktivt sprog. Dansk først – flere sprog kan tilføjes her senere. */
export const locale = "da" as const;

const dictionaries: Record<string, Dictionary> = { da };

export const t: Dictionary = dictionaries[locale];

export function muscleName(key: string) {
  return t.muscles[key] ?? key;
}
