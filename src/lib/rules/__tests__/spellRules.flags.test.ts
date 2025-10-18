import { describe, it, expect } from "vitest";
import { getClassSpellAccess } from "../spellRules";
import type { SrdClass, SrdSubclass } from "../../srd/SRDClient";

describe("Class spell flags", () => {
  it("Bard has ritual casting", () => {
    const mockClass = { name: "Bard" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.hasRitualCasting).toBe(true);
  });

  it("Paladin uses holy focus", () => {
    const mockClass = { name: "Paladin" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.usesFocus).toBe("holy");
  });

  it("Ranger has no special focus", () => {
    const mockClass = { name: "Ranger" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.usesFocus).toBe(null);
  });

  it("Wizard has arcane focus", () => {
    const mockClass = { name: "Wizard" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.usesFocus).toBe("arcane");
  });

  it("Cleric has holy focus", () => {
    const mockClass = { name: "Cleric" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.usesFocus).toBe("holy");
  });

  it("Druid has druidic focus", () => {
    const mockClass = { name: "Druid" } as SrdClass;
    const access = getClassSpellAccess(mockClass, undefined);
    expect(access.usesFocus).toBe("druidic");
  });
});
