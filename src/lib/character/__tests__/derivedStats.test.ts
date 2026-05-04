import { describe, it, expect } from "vitest";
import {
  getTotalLevel,
  getProficiencyBonus,
  getClassBreakdown,
  getHitDiceByClass,
  formatHitDice,
  getSpellSlotsForClasses,
  isAnySpellcaster,
} from "../derivedStats";

const fighter = (lvl: number, primary = true) => ({
  className: "Fighter",
  level: lvl,
  isPrimary: primary,
});
const wizard = (lvl: number, primary = false) => ({
  className: "Wizard",
  level: lvl,
  isPrimary: primary,
});
const cleric = (lvl: number, primary = false) => ({
  className: "Cleric",
  level: lvl,
  isPrimary: primary,
});
const paladin = (lvl: number, primary = false) => ({
  className: "Paladin",
  level: lvl,
  isPrimary: primary,
});
const warlock = (lvl: number, primary = false) => ({
  className: "Warlock",
  level: lvl,
  isPrimary: primary,
});
const rogue = (lvl: number, primary = false) => ({
  className: "Rogue",
  level: lvl,
  isPrimary: primary,
});

describe("getTotalLevel", () => {
  it("sums class levels", () => {
    expect(getTotalLevel([fighter(3), wizard(2)])).toBe(5);
  });
  it("clamps to 1..20", () => {
    expect(getTotalLevel([])).toBe(1);
    expect(getTotalLevel([fighter(15), wizard(15)])).toBe(20);
  });
});

describe("getProficiencyBonus", () => {
  it("uses TOTAL level not class level", () => {
    // Fighter 3 / Wizard 2 = level 5 → PB +3
    expect(getProficiencyBonus([fighter(3), wizard(2)])).toBe(3);
    // Fighter 4 / Wizard 4 = level 8 → PB +3
    expect(getProficiencyBonus([fighter(4), wizard(4)])).toBe(3);
    // Fighter 5 / Wizard 4 = level 9 → PB +4
    expect(getProficiencyBonus([fighter(5), wizard(4)])).toBe(4);
    // Single Fighter 20 → PB +6
    expect(getProficiencyBonus([fighter(20)])).toBe(6);
  });
});

describe("getClassBreakdown", () => {
  it("places primary class first", () => {
    expect(
      getClassBreakdown([wizard(2, false), fighter(3, true)]),
    ).toBe("Fighter 3 / Wizard 2");
  });
  it("handles single class", () => {
    expect(getClassBreakdown([fighter(5, true)])).toBe("Fighter 5");
  });
});

describe("getHitDiceByClass", () => {
  it("groups by die size, largest first", () => {
    const groups = getHitDiceByClass([fighter(3), wizard(2)]);
    expect(formatHitDice(groups)).toBe("3d10 + 2d6");
  });
  it("merges classes that share a die", () => {
    // Fighter (d10) + Paladin (d10)
    const groups = getHitDiceByClass([fighter(2), paladin(3)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(5);
    expect(groups[0].die).toBe("d10");
  });
});

describe("getSpellSlotsForClasses (multiclass slot table)", () => {
  it("Fighter 3 / Wizard 2 → caster level 2 (Wizard only) → {1:3}", () => {
    const r = getSpellSlotsForClasses([fighter(3), wizard(2)]);
    expect(r.effectiveCasterLevel).toBe(2);
    expect(r.slots).toEqual({ 1: 3 });
    expect(r.hasPactMagic).toBe(false);
  });
  it("Paladin 5 / Cleric 5 → caster level 2+5 = 7 → {1:4,2:3,3:3,4:1}", () => {
    const r = getSpellSlotsForClasses([paladin(5), cleric(5)]);
    expect(r.effectiveCasterLevel).toBe(7);
    expect(r.slots).toEqual({ 1: 4, 2: 3, 3: 3, 4: 1 });
  });
  it("excludes Warlock from multiclass slot calculation", () => {
    // Wizard 3 / Warlock 2 → caster level 3 (Warlock excluded)
    const r = getSpellSlotsForClasses([wizard(3), warlock(2)]);
    expect(r.effectiveCasterLevel).toBe(3);
    expect(r.slots).toEqual({ 1: 4, 2: 2 });
    expect(r.hasPactMagic).toBe(true);
  });
  it("Eldritch Knight Fighter 6 → 1/3 caster level 2 → {1:3}", () => {
    const r = getSpellSlotsForClasses([
      { className: "Fighter", level: 6, subclassName: "Eldritch Knight" },
    ]);
    expect(r.effectiveCasterLevel).toBe(2);
    expect(r.slots).toEqual({ 1: 3 });
  });
  it("non-caster single class returns no slots", () => {
    const r = getSpellSlotsForClasses([fighter(5)]);
    expect(r.effectiveCasterLevel).toBe(0);
    expect(r.slots).toEqual({});
    expect(r.hasSlots).toBe(false);
  });
});

describe("isAnySpellcaster", () => {
  it("true for full caster", () => {
    expect(isAnySpellcaster([{ className: "Wizard", level: 1 }])).toBe(true);
  });
  it("true for Warlock at level 1", () => {
    expect(isAnySpellcaster([{ className: "Warlock", level: 1 }])).toBe(true);
  });
  it("Paladin only counts at level 2+", () => {
    expect(isAnySpellcaster([{ className: "Paladin", level: 1 }])).toBe(false);
    expect(isAnySpellcaster([{ className: "Paladin", level: 2 }])).toBe(true);
  });
  it("Eldritch Knight only counts at level 3+", () => {
    expect(
      isAnySpellcaster([
        { className: "Fighter", level: 2, subclassName: "Eldritch Knight" },
      ]),
    ).toBe(false);
    expect(
      isAnySpellcaster([
        { className: "Fighter", level: 3, subclassName: "Eldritch Knight" },
      ]),
    ).toBe(true);
  });
  it("false for pure martial", () => {
    expect(
      isAnySpellcaster([
        { className: "Fighter", level: 5 },
        { className: "Rogue", level: 3 },
      ]),
    ).toBe(false);
  });
});