import { describe, it, expect } from "vitest";
import {
  meetsMulticlassPrerequisites,
  calculateMulticlassSpellcasterLevel,
  getMulticlassSpellSlots,
  getMulticlassProficiencies,
} from "../multiclassRules";

describe("meetsMulticlassPrerequisites", () => {
  it("Wizard requires INT 13", () => {
    expect(
      meetsMulticlassPrerequisites("Wizard", {
        str: 10, dex: 10, con: 10, int: 12, wis: 10, cha: 10,
      }).meets,
    ).toBe(false);
    expect(
      meetsMulticlassPrerequisites("Wizard", {
        str: 10, dex: 10, con: 10, int: 13, wis: 10, cha: 10,
      }).meets,
    ).toBe(true);
  });
  it("Fighter accepts STR 13 OR DEX 13", () => {
    expect(
      meetsMulticlassPrerequisites("Fighter", {
        str: 10, dex: 13, con: 10, int: 10, wis: 10, cha: 10,
      }).meets,
    ).toBe(true);
    expect(
      meetsMulticlassPrerequisites("Fighter", {
        str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      }).meets,
    ).toBe(true);
    expect(
      meetsMulticlassPrerequisites("Fighter", {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      }).meets,
    ).toBe(false);
  });
  it("Paladin requires both STR 13 and CHA 13", () => {
    expect(
      meetsMulticlassPrerequisites("Paladin", {
        str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 12,
      }).meets,
    ).toBe(false);
    expect(
      meetsMulticlassPrerequisites("Paladin", {
        str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 13,
      }).meets,
    ).toBe(true);
  });
});

describe("calculateMulticlassSpellcasterLevel", () => {
  it("full + half caster", () => {
    // Wizard 5 (full=5) + Paladin 4 (half=2) = 7
    expect(
      calculateMulticlassSpellcasterLevel([
        { className: "Wizard", level: 5 },
        { className: "Paladin", level: 4 },
      ]),
    ).toBe(7);
  });
  it("excludes Warlock", () => {
    expect(
      calculateMulticlassSpellcasterLevel([
        { className: "Wizard", level: 3 },
        { className: "Warlock", level: 5 },
      ]),
    ).toBe(3);
  });
  it("Eldritch Knight requires level 3", () => {
    expect(
      calculateMulticlassSpellcasterLevel([
        { className: "Fighter", level: 2, subclass: "Eldritch Knight" },
      ]),
    ).toBe(0);
    expect(
      calculateMulticlassSpellcasterLevel([
        { className: "Fighter", level: 6, subclass: "Eldritch Knight" },
      ]),
    ).toBe(2);
  });
  it("pure non-caster martial → 0", () => {
    expect(
      calculateMulticlassSpellcasterLevel([
        { className: "Fighter", level: 5 },
        { className: "Barbarian", level: 3 },
      ]),
    ).toBe(0);
  });
});

describe("getMulticlassSpellSlots", () => {
  it("level 5 → 4/3/2", () => {
    expect(getMulticlassSpellSlots(5)).toEqual({ 1: 4, 2: 3, 3: 2 });
  });
  it("level 20 → full table", () => {
    expect(getMulticlassSpellSlots(20)).toEqual({
      1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1,
    });
  });
  it("level 0 → no slots", () => {
    expect(getMulticlassSpellSlots(0)).toEqual({});
  });
});

describe("getMulticlassProficiencies (multiclass-only, NOT starting class)", () => {
  it("Fighter multiclass grants armor + martial weapons but NO saves", () => {
    const p = getMulticlassProficiencies("Fighter");
    expect(p.armor).toContain("light armor");
    expect(p.armor).toContain("medium armor");
    expect(p.armor).toContain("shields");
    expect(p.weapons).toContain("martial weapons");
    // critically: no `saves` field
    expect((p as any).saves).toBeUndefined();
  });
  it("Rogue multiclass grants thieves' tools and 1 skill", () => {
    const p = getMulticlassProficiencies("Rogue");
    expect(p.tools).toContain("thieves' tools");
    expect(p.skills?.count).toBe(1);
  });
  it("Wizard multiclass grants no armor or weapons", () => {
    const p = getMulticlassProficiencies("Wizard");
    expect(p.armor).toEqual([]);
    expect(p.weapons).toEqual([]);
  });
});