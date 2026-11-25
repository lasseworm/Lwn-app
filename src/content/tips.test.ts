import { describe, expect, it } from "vitest";
import { tipOfTheDay, tipsDa } from "./tips";

describe("tipOfTheDay", () => {
  it("er det samme hele den danske kalenderdag", () => {
    // 25. nov. 2026: 00:30 dansk tid (23:30 UTC dagen før) og 23:30 dansk tid
    const early = tipOfTheDay(new Date("2026-11-24T23:30:00Z"));
    const late = tipOfTheDay(new Date("2026-11-25T22:30:00Z"));
    expect(early.id).toBe(late.id);
  });

  it("skifter ved midnat dansk tid", () => {
    const before = tipOfTheDay(new Date("2026-11-25T22:59:00Z")); // 23:59 dansk tid
    const after = tipOfTheDay(new Date("2026-11-25T23:01:00Z")); // 00:01 dansk tid
    expect(before.id).not.toBe(after.id);
  });

  it("går alle tips igennem på lige så mange dage", () => {
    const seen = new Set<string>();
    for (let i = 0; i < tipsDa.length; i++) seen.add(tipOfTheDay(new Date(Date.UTC(2026, 0, 1, 12) + i * 86_400_000)).id);
    expect(seen.size).toBe(tipsDa.length);
  });

  it("alle tips har unikt id, titel og tekst", () => {
    expect(new Set(tipsDa.map((t) => t.id)).size).toBe(tipsDa.length);
    for (const t of tipsDa) {
      expect(t.title.length).toBeGreaterThan(3);
      expect(t.text.length).toBeGreaterThan(20);
    }
  });
});
