import { describe, it, expect } from "vitest";
import { getCantripCount } from "../spellRules";

describe("Cantrip counts", () => {
  it("Wizard level 1 cantrip count is defined and >= 3", () => {
    const count = getCantripCount("Wizard", 1);
    expect(count).toBeDefined();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("Bard level 1 cantrip count is defined", () => {
    const count = getCantripCount("Bard", 1);
    expect(count).toBeDefined();
    expect(count).toBeGreaterThan(0);
  });

  it("Cleric level 1 cantrip count is defined", () => {
    const count = getCantripCount("Cleric", 1);
    expect(count).toBeDefined();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
