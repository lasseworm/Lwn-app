import { describe, expect, it } from "vitest";
import catalog from "@/lib/training/__fixtures__/catalog.json";
import { illustrations } from ".";
import { solve } from "./geometry";

describe("stregtegninger", () => {
  it("alle øvelser i kataloget har en tegning", () => {
    const missing = (catalog as { slug: string }[]).map((e) => e.slug).filter((s) => !illustrations[s]);
    expect(missing).toEqual([]);
  });

  it("alle positurer giver gyldige koordinater inden for billedet", () => {
    for (const [slug, ill] of Object.entries(illustrations)) {
      for (const pose of [ill.start, ill.end]) {
        const j = solve(pose);
        const pts = [j.head, j.neck, j.hip, ...j.arms.flatMap((a) => [a.sh, a.el, a.ha]), ...j.legs.flatMap((l) => [l.hp, l.kn, l.an])];
        for (const [x, y] of pts) {
          expect(Number.isFinite(x) && Number.isFinite(y), slug).toBe(true);
          expect(x, slug).toBeGreaterThan(-10);
          expect(x, slug).toBeLessThan(110);
          expect(y, slug).toBeGreaterThan(-10);
          expect(y, slug).toBeLessThan(110);
        }
      }
    }
  });
});
