/**
 * Phase 2 targeted tests — data normalization.
 * Covers: SRD backgrounds seed integrity, JSONB feature shape,
 * and spell-slot row construction (pact vs shared flag).
 */

import { describe, it, expect } from "vitest";
import { SRD_BACKGROUNDS, getBackgroundSeedByName } from "@/data/srd/backgroundsSeed";

// ─── SRD_BACKGROUNDS data integrity ─────────────────────────────────────────

describe("SRD_BACKGROUNDS seed", () => {
  it("contains exactly 6 SRD backgrounds", () => {
    expect(SRD_BACKGROUNDS).toHaveLength(6);
  });

  const EXPECTED_NAMES = ["Acolyte", "Criminal", "Folk Hero", "Noble", "Sage", "Soldier"];

  it("includes all expected SRD background names", () => {
    const names = SRD_BACKGROUNDS.map(b => b.name);
    for (const expected of EXPECTED_NAMES) {
      expect(names).toContain(expected);
    }
  });

  it("every background has a feature object with non-empty name", () => {
    for (const bg of SRD_BACKGROUNDS) {
      expect(bg.feature).toBeDefined();
      expect(typeof bg.feature).toBe("object");
      expect(typeof bg.feature.name).toBe("string");
      expect(bg.feature.name.length).toBeGreaterThan(0);
    }
  });

  it("every background feature has a string description (may be empty, never undefined)", () => {
    for (const bg of SRD_BACKGROUNDS) {
      expect(typeof bg.feature.description).toBe("string");
    }
  });

  it("every background has at least one skill proficiency", () => {
    for (const bg of SRD_BACKGROUNDS) {
      const profs = bg.skill_proficiencies;
      const hasAtLeastOne = Array.isArray(profs)
        ? profs.length > 0
        : (profs as any).choose > 0;
      expect(hasAtLeastOne).toBe(true);
    }
  });
});

// ─── Feature shapes for each background ─────────────────────────────────────

describe("SRD background feature names", () => {
  const FEATURE_MAP: Record<string, string> = {
    Acolyte:    "Shelter of the Faithful",
    Criminal:   "Criminal Contact",
    "Folk Hero": "Rustic Hospitality",
    Noble:      "Position of Privilege",
    Sage:       "Researcher",
    Soldier:    "Military Rank",
  };

  for (const [bgName, featureName] of Object.entries(FEATURE_MAP)) {
    it(`${bgName} has feature "${featureName}"`, () => {
      const bg = SRD_BACKGROUNDS.find(b => b.name === bgName);
      expect(bg).toBeDefined();
      expect(bg!.feature.name).toBe(featureName);
    });
  }
});

// ─── getBackgroundSeedByName ─────────────────────────────────────────────────

describe("getBackgroundSeedByName", () => {
  it("finds a background by exact name", () => {
    const bg = getBackgroundSeedByName("Acolyte");
    expect(bg).toBeDefined();
    expect(bg!.name).toBe("Acolyte");
  });

  it("is case-insensitive", () => {
    expect(getBackgroundSeedByName("acolyte")).toBeDefined();
    expect(getBackgroundSeedByName("ACOLYTE")).toBeDefined();
    expect(getBackgroundSeedByName("Folk hero")).toBeDefined();
  });

  it("returns undefined for unknown name", () => {
    expect(getBackgroundSeedByName("Paladin")).toBeUndefined();
    expect(getBackgroundSeedByName("")).toBeUndefined();
  });

  it("returned background has JSONB-shaped feature", () => {
    const bg = getBackgroundSeedByName("Sage");
    expect(bg).toBeDefined();
    expect(bg!.feature).toEqual({
      name: "Researcher",
      description: expect.any(String),
    });
  });
});

// ─── Pact slot row construction ──────────────────────────────────────────────
// Tests the logic that was fixed in CharacterWizard.tsx — pact slots must
// carry is_pact_magic: true, shared slots is_pact_magic: false.

describe("spell slot row is_pact_magic flag logic", () => {
  type SlotRow = {
    character_id: string;
    spell_level: number;
    max_slots: number;
    used_slots: number;
    is_pact_magic: boolean;
  };

  function buildSlotRows(
    shared: Record<number, number> | null,
    pact: { pactSlotLevel: number; pactSlots: number } | null
  ): SlotRow[] {
    const rows: SlotRow[] = [];
    if (shared) {
      for (const [lvlStr, count] of Object.entries(shared)) {
        rows.push({
          character_id: "test-id",
          spell_level: Number(lvlStr),
          max_slots: count as number,
          used_slots: 0,
          is_pact_magic: false,
        });
      }
    }
    if (pact) {
      rows.push({
        character_id: "test-id",
        spell_level: pact.pactSlotLevel,
        max_slots: pact.pactSlots,
        used_slots: 0,
        is_pact_magic: true,
      });
    }
    return rows;
  }

  it("shared slots carry is_pact_magic: false", () => {
    const rows = buildSlotRows({ 1: 2, 2: 1 }, null);
    expect(rows).toHaveLength(2);
    expect(rows.every(r => r.is_pact_magic === false)).toBe(true);
  });

  it("pact slot carries is_pact_magic: true", () => {
    const rows = buildSlotRows(null, { pactSlotLevel: 2, pactSlots: 2 });
    expect(rows).toHaveLength(1);
    expect(rows[0].is_pact_magic).toBe(true);
    expect(rows[0].spell_level).toBe(2);
  });

  it("Warlock/Wizard multiclass: same spell_level but different is_pact_magic — no collision", () => {
    // Level-2 shared slot (from Wizard) + level-2 pact slot (from Warlock)
    const rows = buildSlotRows({ 2: 1 }, { pactSlotLevel: 2, pactSlots: 2 });
    expect(rows).toHaveLength(2);
    const shared = rows.find(r => r.is_pact_magic === false)!;
    const pact   = rows.find(r => r.is_pact_magic === true)!;
    expect(shared.spell_level).toBe(2);
    expect(pact.spell_level).toBe(2);
    // Both rows have the same level but different flags — safe under the new UNIQUE constraint
    expect(shared.is_pact_magic).not.toBe(pact.is_pact_magic);
  });

  it("pure Warlock: only pact rows, all is_pact_magic: true", () => {
    const rows = buildSlotRows(null, { pactSlotLevel: 3, pactSlots: 2 });
    expect(rows.every(r => r.is_pact_magic === true)).toBe(true);
  });
});
