import { describe, it, expect } from "vitest";
import type { SrdSpell } from "../../srd/SRDClient";
import { spellHasCostlyComponents } from "../spellRules";

describe("Costly material detection", () => {
  const mk = (material: string): SrdSpell => ({ material, description: material } as any);

  it("detects gp values", () => {
    expect(spellHasCostlyComponents(mk("a pearl worth 100 gp"))).toBe(true);
  });

  it("detects diamonds", () => {
    expect(spellHasCostlyComponents(mk("diamond dust worth at least 300 gp"))).toBe(true);
  });

  it("detects pearls", () => {
    expect(spellHasCostlyComponents(mk("a pearl of at least 100 gp value"))).toBe(true);
  });

  it("detects incense with worth", () => {
    expect(spellHasCostlyComponents(mk("incense worth 250 gp"))).toBe(true);
  });

  it("false for no materials", () => {
    expect(spellHasCostlyComponents(mk(""))).toBe(false);
  });

  it("false for simple materials", () => {
    expect(spellHasCostlyComponents(mk("a bit of bat fur"))).toBe(false);
  });
});
