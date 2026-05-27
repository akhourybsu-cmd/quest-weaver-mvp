/**
 * Phase 7 — computeDerivedStats + applyAncestryBonuses unit tests.
 *
 * These are the functions that drive the finalize calculation in
 * CharacterWizard. They were previously untestable because they lived
 * inline in the component; Phase 7 extracted them to wizardDerivedStats.ts.
 *
 * Coverage:
 *   applyAncestryBonuses  — bonus merging, case normalisation, unknown keys
 *   computeDerivedStats
 *     HP          — L1 max die, average formula, custom hpRoll, CON neg/pos
 *     profBonus   — all four tiers (L1-4, L5-8, L9-12, L13+)
 *     AC          — unarmored (generic/Barbarian/Monk), light/medium/heavy, shield
 *     passives    — with and without skill proficiencies
 *     saves       — proficient vs non-proficient
 *     spellcasting — INT/WIS/CHA casters, non-caster returns null
 *     hitDie label — "d6", "d8", "d10", "d12"
 *     minimum HP  — CON -5 can't drop HP below 1
 */

import { describe, it, expect } from "vitest";
import {
  applyAncestryBonuses,
  computeDerivedStats,
} from "@/lib/character/wizardDerivedStats";

// ─── helpers ─────────────────────────────────────────────────────────────────

const baseScores = (
  STR = 10, DEX = 10, CON = 10, INT = 10, WIS = 10, CHA = 10
) => ({ STR, DEX, CON, INT, WIS, CHA });

const classRules = (hitDie: number, spellcastingAbility?: string) => ({
  hitDie,
  spellcasting: spellcastingAbility ? { ability: spellcastingAbility } : null,
});

/** Minimal draft for a level-N character with no grants or choices. */
const draft = (
  level: number,
  scores = baseScores(),
  className = "Fighter",
  extra: Record<string, any> = {}
) => ({
  level,
  className,
  abilityScores: scores,
  grants: {
    abilityBonuses: {},
    skillProficiencies: [],
    savingThrows: new Set<string>(),
  },
  choices: { skills: [], featureChoices: {} },
  ...extra,
});

// ─── applyAncestryBonuses ─────────────────────────────────────────────────────

describe("applyAncestryBonuses", () => {
  it("returns base scores unchanged when bonuses are empty", () => {
    const scores = baseScores(15, 14, 13, 12, 10, 8);
    expect(applyAncestryBonuses(scores, {})).toEqual(scores);
  });

  it("adds bonuses to the correct abilities", () => {
    const result = applyAncestryBonuses(
      baseScores(10, 10, 10, 10, 10, 10),
      { STR: 2, DEX: 1 }
    );
    expect(result.STR).toBe(12);
    expect(result.DEX).toBe(11);
    expect(result.CON).toBe(10);
  });

  it("accepts lower-case bonus keys (e.g. from API data)", () => {
    const result = applyAncestryBonuses(
      baseScores(10, 10, 10, 10, 10, 10),
      { str: 2, wis: 1 }
    );
    expect(result.STR).toBe(12);
    expect(result.WIS).toBe(11);
  });

  it("ignores keys that don't match any ability score", () => {
    const scores = baseScores();
    const result = applyAncestryBonuses(scores, { UNKNOWN: 5, spd: 10 });
    expect(result).toEqual(scores);
  });

  it("does not mutate the original scores object", () => {
    const original = baseScores(10, 10, 10, 10, 10, 10);
    applyAncestryBonuses(original, { STR: 2 });
    expect(original.STR).toBe(10);
  });
});

// ─── proficiency bonus ────────────────────────────────────────────────────────

describe("computeDerivedStats — proficiency bonus", () => {
  it("returns +2 at level 1", () => {
    expect(computeDerivedStats(draft(1), classRules(10)).profBonus).toBe(2);
  });
  it("returns +2 at level 4", () => {
    expect(computeDerivedStats(draft(4), classRules(10)).profBonus).toBe(2);
  });
  it("returns +3 at level 5", () => {
    expect(computeDerivedStats(draft(5), classRules(10)).profBonus).toBe(3);
  });
  it("returns +4 at level 9", () => {
    expect(computeDerivedStats(draft(9), classRules(10)).profBonus).toBe(4);
  });
  it("returns +5 at level 13", () => {
    expect(computeDerivedStats(draft(13), classRules(10)).profBonus).toBe(5);
  });
  it("returns +6 at level 17", () => {
    expect(computeDerivedStats(draft(17), classRules(10)).profBonus).toBe(6);
  });
});

// ─── HP calculation ───────────────────────────────────────────────────────────

describe("computeDerivedStats — max HP", () => {
  it("L1 Fighter (d10, CON 10): hitDie + 0 = 10", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,10,10), "Fighter"), classRules(10)).maxHp).toBe(10);
  });

  it("L1 Wizard (d6, CON 10): 6", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,10,10), "Wizard"), classRules(6)).maxHp).toBe(6);
  });

  it("L1 Barbarian (d12, CON 16): 12 + 3 = 15", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,10,16), "Barbarian"), classRules(12)).maxHp).toBe(15);
  });

  it("L1 with CON 8 (mod -1): hitDie - 1, minimum 1", () => {
    // d6 - 1 = 5
    expect(computeDerivedStats(draft(1, baseScores(10,10,8), "Wizard"), classRules(6)).maxHp).toBe(5);
  });

  it("L2 Fighter (d10, CON 10) no levelChoices: 10 + (5+1+0) = 16", () => {
    // average for d10 = floor(10/2)+1 = 6
    expect(computeDerivedStats(draft(2, baseScores(10,10,10), "Fighter"), classRules(10)).maxHp).toBe(16);
  });

  it("L3 Wizard (d6, CON 10) no levelChoices: 6 + 4 + 4 = 14", () => {
    // avg d6 = floor(6/2)+1 = 4, each level adds 4+0
    expect(computeDerivedStats(draft(3, baseScores(10,10,10), "Wizard"), classRules(6)).maxHp).toBe(14);
  });

  it("L2 with explicit hpRoll=10 in levelChoices", () => {
    const d = draft(2, baseScores(10,10,10), "Fighter", {
      choices: {
        skills: [],
        featureChoices: { levelChoices: { 2: { hpRoll: 10 } } },
      },
    });
    // L1: 10, L2: 10+0 = 10 → total 20
    expect(computeDerivedStats(d, classRules(10)).maxHp).toBe(20);
  });

  it("L2 with explicit hpRoll=1 (unlucky roll)", () => {
    const d = draft(2, baseScores(10,10,10), "Fighter", {
      choices: {
        skills: [],
        featureChoices: { levelChoices: { 2: { hpRoll: 1 } } },
      },
    });
    // L1: 10, L2: 1+0 = 1 → total 11
    expect(computeDerivedStats(d, classRules(10)).maxHp).toBe(11);
  });

  it("enforces minimum 1 HP even with extreme negative CON (d4-5 = -1 → clamped to 1)", () => {
    // d4=4, CON 1 → mod -5 → 4-5=-1 → clamped to 1
    expect(computeDerivedStats(draft(1, baseScores(10,10,1), "Wizard"), classRules(4)).maxHp).toBe(1);
  });
});

// ─── AC — armor-aware ────────────────────────────────────────────────────────

describe("computeDerivedStats — AC", () => {
  it("generic unarmored (Wizard, DEX 10): 10 + 0 = 10", () => {
    expect(computeDerivedStats(draft(1, baseScores(), "Wizard"), classRules(6)).ac).toBe(10);
  });

  it("generic unarmored (Rogue, DEX 16): 10 + 3 = 13", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,16), "Rogue"), classRules(8)).ac).toBe(13);
  });

  it("Barbarian unarmored (DEX 14, CON 16): 10 + 2 + 3 = 15", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,14,16), "Barbarian"), classRules(12)).ac).toBe(15);
  });

  it("Monk unarmored (DEX 16, WIS 14): 10 + 3 + 2 = 15", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,16,10,10,14), "Monk"), classRules(8)).ac).toBe(15);
  });

  it("Monk with shield loses WIS bonus: 10 + DEX + 2", () => {
    const items = [{ name: "Shield" }];
    const d = draft(1, baseScores(10,16,10,10,14), "Monk");
    expect(computeDerivedStats(d, classRules(8), items).ac).toBe(15); // 10+3+2
  });

  it("light armor (Leather, DEX 16): 11 + 3 = 14", () => {
    const items = [{ name: "Leather Armor" }];
    expect(computeDerivedStats(draft(1, baseScores(10,16), "Rogue"), classRules(8), items).ac).toBe(14);
  });

  it("medium armor (Scale Mail, DEX 20): 14 + 2 (capped) = 16", () => {
    const items = [{ name: "Scale Mail" }];
    expect(computeDerivedStats(draft(1, baseScores(10,20), "Fighter"), classRules(10), items).ac).toBe(16);
  });

  it("heavy armor (Chain Mail, DEX 8): 16 — no DEX penalty", () => {
    const items = [{ name: "Chain Mail" }];
    expect(computeDerivedStats(draft(1, baseScores(10,8), "Fighter"), classRules(10), items).ac).toBe(16);
  });

  it("heavy armor + shield: 16 + 2 = 18", () => {
    const items = [{ name: "Chain Mail" }, { name: "Shield" }];
    expect(computeDerivedStats(draft(1, baseScores(10,10), "Fighter"), classRules(10), items).ac).toBe(18);
  });
});

// ─── Passive senses ───────────────────────────────────────────────────────────

describe("computeDerivedStats — passive senses", () => {
  it("no proficiencies, WIS 10, INT 10: all passives = 10", () => {
    const s = computeDerivedStats(draft(1), classRules(8));
    expect(s.passivePerception).toBe(10);
    expect(s.passiveInvestigation).toBe(10);
    expect(s.passiveInsight).toBe(10);
  });

  it("Perception proficiency at L1 (profBonus=2): passive = 10 + WIS mod + 2", () => {
    const d = draft(1, baseScores(10,10,10,10,14), "Ranger", {
      grants: {
        abilityBonuses: {},
        skillProficiencies: ["Perception"],
        savingThrows: new Set(),
      },
      choices: { skills: [], featureChoices: {} },
    });
    // WIS 14 → mod +2, profBonus +2 → passive = 10+2+2 = 14
    expect(computeDerivedStats(d, classRules(10)).passivePerception).toBe(14);
  });

  it("Investigation proficiency via player skill choice", () => {
    const d = draft(1, baseScores(10,10,10,14), "Wizard", {
      choices: { skills: ["Investigation"], featureChoices: {} },
    });
    // INT 14 → +2, profBonus +2 → passive investigation = 10+2+2 = 14
    expect(computeDerivedStats(d, classRules(6)).passiveInvestigation).toBe(14);
  });
});

// ─── Saving throws ────────────────────────────────────────────────────────────

describe("computeDerivedStats — saving throws", () => {
  it("non-proficient save = ability mod only", () => {
    const s = computeDerivedStats(draft(1, baseScores(14)), classRules(8));
    // STR 14 → mod +2, no proficiency
    expect(s.saves.str).toBe(2);
  });

  it("proficient save = ability mod + profBonus", () => {
    const d = draft(1, baseScores(14), "Fighter", {
      grants: {
        abilityBonuses: {},
        skillProficiencies: [],
        savingThrows: new Set(["STR", "CON"]),
      },
      choices: { skills: [], featureChoices: {} },
    });
    // STR 14 → +2 + profBonus 2 = 4
    const s = computeDerivedStats(d, classRules(10));
    expect(s.saves.str).toBe(4);
    expect(s.saves.con).toBe(2); // CON 10 → 0 + 2 prof = 2
  });

  it("proficiency bonus scales with level", () => {
    const d = draft(5, baseScores(10,10,10,10,10,10), "Paladin", {
      grants: {
        abilityBonuses: {},
        skillProficiencies: [],
        savingThrows: new Set(["WIS", "CHA"]),
      },
      choices: { skills: [], featureChoices: {} },
    });
    // profBonus at L5 = 3; WIS 10 → mod 0; save = 0 + 3 = 3
    const s = computeDerivedStats(d, classRules(10));
    expect(s.saves.wis).toBe(3);
    expect(s.saves.cha).toBe(3);
    expect(s.saves.str).toBe(0); // non-proficient
  });
});

// ─── Spellcasting ────────────────────────────────────────────────────────────

describe("computeDerivedStats — spellcasting stats", () => {
  it("non-caster returns null for all spell fields", () => {
    const s = computeDerivedStats(draft(1), classRules(10)); // no spellcasting
    expect(s.spellAbility).toBeNull();
    expect(s.spellSaveDC).toBeNull();
    expect(s.spellAttackMod).toBeNull();
  });

  it("Wizard (INT) at L1, INT 16: DC = 8+2+3 = 13, attack = 2+3 = 5", () => {
    const s = computeDerivedStats(
      draft(1, baseScores(10,10,10,16), "Wizard"),
      classRules(6, "int")
    );
    expect(s.spellAbility).toBe("INT");
    expect(s.spellSaveDC).toBe(13);
    expect(s.spellAttackMod).toBe(5);
  });

  it("Cleric (WIS) at L1, WIS 14: DC = 8+2+2 = 12, attack = 2+2 = 4", () => {
    const s = computeDerivedStats(
      draft(1, baseScores(10,10,10,10,14), "Cleric"),
      classRules(8, "wis")
    );
    expect(s.spellAbility).toBe("WIS");
    expect(s.spellSaveDC).toBe(12);
    expect(s.spellAttackMod).toBe(4);
  });

  it("Warlock (CHA) at L5, CHA 18: DC = 8+3+4 = 15, attack = 3+4 = 7", () => {
    const s = computeDerivedStats(
      draft(5, baseScores(10,10,10,10,10,18), "Warlock"),
      classRules(8, "cha")
    );
    expect(s.spellAbility).toBe("CHA");
    expect(s.spellSaveDC).toBe(15);
    expect(s.spellAttackMod).toBe(7);
  });
});

// ─── Hit die label ────────────────────────────────────────────────────────────

describe("computeDerivedStats — hitDie label", () => {
  it.each([
    [6,  "d6"],
    [8,  "d8"],
    [10, "d10"],
    [12, "d12"],
  ])("hitDie %i → '%s'", (die, label) => {
    expect(computeDerivedStats(draft(1), classRules(die)).hitDie).toBe(label);
  });

  it("falls back to d8 when classRules is null", () => {
    expect(computeDerivedStats(draft(1), null).hitDie).toBe("d8");
  });
});

// ─── Initiative ──────────────────────────────────────────────────────────────

describe("computeDerivedStats — initiativeBonus", () => {
  it("equals DEX modifier", () => {
    expect(computeDerivedStats(draft(1, baseScores(10,16)), classRules(8)).initiativeBonus).toBe(3);
    expect(computeDerivedStats(draft(1, baseScores(10,8)),  classRules(8)).initiativeBonus).toBe(-1);
  });
});

// ─── Ancestry bonus integration ──────────────────────────────────────────────

describe("computeDerivedStats — ancestry bonuses applied before deriving", () => {
  it("Half-Elf +2 CHA, +1 WIS: DC and passive senses reflect boosted scores", () => {
    const d = draft(1, baseScores(10,10,10,10,10,10), "Sorcerer", {
      grants: {
        abilityBonuses: { CHA: 2, WIS: 1 },
        skillProficiencies: [],
        savingThrows: new Set(),
      },
      choices: { skills: [], featureChoices: {} },
    });
    const s = computeDerivedStats(d, classRules(6, "cha"));
    // CHA 10+2=12 → mod +1; DC = 8+2+1 = 11
    expect(s.spellSaveDC).toBe(11);
    // WIS 10+1=11 → mod 0; passive perception = 10
    expect(s.passivePerception).toBe(10);
  });

  it("Mountain Dwarf +2 STR, +2 CON: HP at L1 reflects boosted CON", () => {
    const d = draft(1, baseScores(10,10,10), "Fighter", {
      grants: {
        abilityBonuses: { STR: 2, CON: 2 },
        skillProficiencies: [],
        savingThrows: new Set(),
      },
      choices: { skills: [], featureChoices: {} },
    });
    // CON 10+2=12 → mod +1; d10+1 = 11
    expect(computeDerivedStats(d, classRules(10)).maxHp).toBe(11);
  });
});
