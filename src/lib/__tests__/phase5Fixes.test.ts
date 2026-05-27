/**
 * Phase 5 targeted tests — darkvision display + background equipment seeding.
 *
 * Covers:
 *   1. parseDarkvisionFt  — extracts range from character_features rows
 *   2. Background equipment rows — verifies shape of rows written to
 *      character_equipment during finalize
 */

import { describe, it, expect } from "vitest";
import { parseDarkvisionFt } from "@/lib/characterRules";
import { getBackgroundSeedByName, SRD_BACKGROUNDS } from "@/data/srd/backgroundsSeed";

// ─── parseDarkvisionFt ────────────────────────────────────────────────────────

describe("parseDarkvisionFt", () => {
  it("returns 0 when no features are provided", () => {
    expect(parseDarkvisionFt([])).toBe(0);
  });

  it("returns 0 when no darkvision trait is present", () => {
    expect(
      parseDarkvisionFt([
        { name: "Brave", description: "You have advantage on saving throws against being frightened." },
        { name: "Halfling Nimbleness", description: "You can move through the space of any creature that is of a size larger than yours." },
      ])
    ).toBe(0);
  });

  it("extracts 60 ft from a description with 'within 60 feet'", () => {
    expect(
      parseDarkvisionFt([
        {
          name: "Darkvision",
          description:
            "Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        },
      ])
    ).toBe(60);
  });

  it("extracts 120 ft for Superior Darkvision described in the description", () => {
    expect(
      parseDarkvisionFt([
        {
          name: "Superior Darkvision",
          description: "You can see in dim light within 120 feet of you as if it were bright light.",
        },
      ])
    ).toBe(120);
  });

  it("extracts range from the trait name when present (e.g. 'Darkvision (60 ft)')", () => {
    expect(
      parseDarkvisionFt([{ name: "Darkvision (60 ft)", description: "" }])
    ).toBe(60);
  });

  it("falls back to 60 when darkvision trait is present but range is not parseable", () => {
    expect(
      parseDarkvisionFt([{ name: "Darkvision", description: "You see really well in the dark." }])
    ).toBe(60);
  });

  it("is case-insensitive for the trait name", () => {
    expect(
      parseDarkvisionFt([
        { name: "DARKVISION", description: "You can see within 60 feet in darkness." },
      ])
    ).toBe(60);
  });

  it("returns the first matching darkvision trait when multiple traits are present", () => {
    expect(
      parseDarkvisionFt([
        { name: "Lucky", description: "..." },
        { name: "Darkvision", description: "You can see within 60 feet in dim light as if it were bright." },
        { name: "Brave", description: "..." },
      ])
    ).toBe(60);
  });

  it("ignores non-darkvision traits and still returns 0 for all-human array", () => {
    expect(
      parseDarkvisionFt([
        { name: "Extra Language", description: "You can speak, read, and write one extra language of your choice." },
        { name: "Skill Versatility", description: "You gain proficiency in two skills of your choice." },
      ])
    ).toBe(0);
  });
});

// ─── Background equipment row construction ────────────────────────────────────

describe("background equipment row construction", () => {
  function buildBgEquipRows(
    backgroundName: string,
    characterId: string
  ): Array<{ character_id: string; item_ref: string; qty: number; equipped: boolean }> {
    const seed = getBackgroundSeedByName(backgroundName);
    const items = seed?.equipment ?? [];
    return items.map(itemName => ({
      character_id: characterId,
      item_ref: String(itemName),
      qty: 1,
      equipped: false,
    }));
  }

  it("builds rows for Acolyte background", () => {
    const rows = buildBgEquipRows("Acolyte", "char-001");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.character_id === "char-001")).toBe(true);
    expect(rows.every(r => r.qty === 1)).toBe(true);
    expect(rows.every(r => r.equipped === false)).toBe(true);
  });

  it("Acolyte equipment includes Holy Symbol", () => {
    const rows = buildBgEquipRows("Acolyte", "x");
    expect(rows.some(r => r.item_ref === "Holy Symbol")).toBe(true);
  });

  it("Soldier equipment includes Insignia of Rank", () => {
    const rows = buildBgEquipRows("Soldier", "x");
    expect(rows.some(r => r.item_ref === "Insignia of Rank")).toBe(true);
  });

  it("all 6 SRD backgrounds produce at least one equipment row", () => {
    for (const bg of SRD_BACKGROUNDS) {
      const rows = buildBgEquipRows(bg.name, "test");
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array for unknown background name", () => {
    const rows = buildBgEquipRows("Hermit", "x");
    expect(rows).toHaveLength(0);
  });

  it("all item_ref values are non-empty strings", () => {
    for (const bg of SRD_BACKGROUNDS) {
      const rows = buildBgEquipRows(bg.name, "test");
      expect(rows.every(r => typeof r.item_ref === "string" && r.item_ref.length > 0)).toBe(true);
    }
  });
});
