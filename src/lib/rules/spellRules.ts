import type { SrdClass, SrdSubclass, SrdSpell } from "../srd/SRDClient";

// ==================== TYPES ====================

export type SlotInfo = {
  shared?: {
    casterLevel: number;
    maxSpellLevel: number;
    slots: Record<number, number>;
  };
  pact?: {
    warlockLevel: number;
    pactSlotLevel: number;
    pactSlots: number;
  };
};

export type ClassSpellAccess = {
  baseList: string;
  expanded: string[];
  autoPrepared: { name: string; id: string; level: number }[];
  hasRitualCasting: boolean;
  usesFocus: "holy" | "druidic" | "arcane" | null;
};

export type KnownPrepared = {
  model: "prepared" | "known";
  preparedMax?: number;
  knownMax?: number;
};

// ==================== CANTRIP TABLES ====================

const CANTRIP_COUNTS: Record<string, Record<number, number>> = {
  Bard: { 1: 2, 4: 3, 10: 4 },
  Cleric: { 1: 3, 4: 4, 10: 5 },
  Druid: { 1: 2, 4: 3, 10: 4 },
  Sorcerer: { 1: 4, 4: 5, 10: 6 },
  Warlock: { 1: 2, 4: 3, 10: 4, 16: 5 },
  Wizard: { 1: 3, 4: 4, 10: 5 },
};

// ==================== KNOWN SPELLS TABLES ====================

const BARD_KNOWN = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
const SORCERER_KNOWN = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
const WARLOCK_KNOWN = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
const RANGER_KNOWN = [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];

// ==================== SPELL SLOT TABLES ====================

const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// ==================== HELPER FUNCTIONS ====================

export function getCantripCount(className: string, level: number): number {
  const table = CANTRIP_COUNTS[className];
  if (!table) return 0;

  const levels = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  for (let i = levels.length - 1; i >= 0; i--) {
    if (level >= levels[i]) {
      return table[levels[i]];
    }
  }
  return 0;
}

function getKnownSpellsCount(className: string, level: number): number {
  const idx = Math.min(level, 20);
  switch (className) {
    case "Bard":
      return BARD_KNOWN[idx] || 0;
    case "Sorcerer":
      return SORCERER_KNOWN[idx] || 0;
    case "Warlock":
      return WARLOCK_KNOWN[idx] || 0;
    case "Ranger":
      return RANGER_KNOWN[idx] || 0;
    default:
      return 0;
  }
}

export function getWarlockPactSlotLevel(warlockLevel: number): number {
  if (warlockLevel >= 9) return 5;
  if (warlockLevel >= 7) return 4;
  if (warlockLevel >= 5) return 3;
  if (warlockLevel >= 3) return 2;
  return 1;
}

function getWarlockPactSlots(warlockLevel: number): number {
  if (warlockLevel >= 17) return 4;
  if (warlockLevel >= 11) return 3;
  if (warlockLevel >= 2) return 2;
  return 1;
}

function getMaxSpellLevelFromSlots(slots: number[]): number {
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i] > 0) return i + 1;
  }
  return 0;
}

// ==================== MAIN API FUNCTIONS ====================

export function getSpellSlotInfo(
  classes: Array<{ className: string; level: number }>
): SlotInfo {
  const result: SlotInfo = {};

  let warlockLevel = 0;
  let fullCasterLevels = 0;
  let halfCasterLevels = 0;
  let thirdCasterLevels = 0;

  for (const cls of classes) {
    if (cls.className === "Warlock") {
      warlockLevel = cls.level;
    } else if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(cls.className)) {
      fullCasterLevels += cls.level;
    } else if (["Paladin", "Ranger"].includes(cls.className)) {
      halfCasterLevels += cls.level;
    } else if (["Eldritch Knight", "Arcane Trickster"].includes(cls.className)) {
      thirdCasterLevels += cls.level;
    }
  }

  // Warlock pact magic
  if (warlockLevel > 0) {
    result.pact = {
      warlockLevel,
      pactSlotLevel: getWarlockPactSlotLevel(warlockLevel),
      pactSlots: getWarlockPactSlots(warlockLevel),
    };
  }

  // Shared spell slots (non-warlock)
  const multiclassCasterLevel =
    fullCasterLevels +
    Math.floor(halfCasterLevels / 2) +
    Math.floor(thirdCasterLevels / 3);

  if (multiclassCasterLevel > 0) {
    const slots = FULL_CASTER_SLOTS[Math.min(multiclassCasterLevel, 20)] || [
      0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const slotsRecord: Record<number, number> = {};
    slots.forEach((count, idx) => {
      if (count > 0) slotsRecord[idx + 1] = count;
    });

    result.shared = {
      casterLevel: multiclassCasterLevel,
      maxSpellLevel: getMaxSpellLevelFromSlots(slots),
      slots: slotsRecord,
    };
  }

  return result;
}

export function getClassSpellAccess(
  cls: SrdClass,
  subclass?: SrdSubclass
): ClassSpellAccess {
  const className = cls.name;
  const result: ClassSpellAccess = {
    baseList: className.toLowerCase(),
    expanded: [],
    autoPrepared: [],
    hasRitualCasting: false,
    usesFocus: null,
  };

  // Ritual casting (SRD 5.1): Bard, Cleric, Druid, Wizard can cast rituals
  if (["Bard", "Cleric", "Druid", "Wizard"].includes(className)) {
    result.hasRitualCasting = true;
  }

  // Focus type
  if (["Bard", "Sorcerer", "Warlock", "Wizard"].includes(className)) {
    result.usesFocus = "arcane";
  } else if (className === "Cleric" || className === "Paladin") {
    result.usesFocus = "holy";
  } else if (className === "Druid") {
    result.usesFocus = "druidic";
  } else if (className === "Ranger") {
    result.usesFocus = null; // Ranger typically uses a component pouch; no special focus in SRD
  }

  // Subclass expansions and auto-prepared
  // For now, we'll handle this via features text parsing or leave empty
  // Future: Add spells_granted and expanded_spell_list to SrdSubclass schema
  if (subclass) {
    // TODO: Parse subclass features for domain/oath/circle spells
    // For MVP, leave empty - can be manually added later
  }

  return result;
}

export function getKnownPreparedModel(
  className: string,
  level: number,
  abilityMod: number
): KnownPrepared {
  // Prepared casters
  if (["Cleric", "Druid", "Wizard"].includes(className)) {
    return {
      model: "prepared",
      preparedMax: Math.max(1, abilityMod + level),
    };
  }

  if (className === "Paladin") {
    return {
      model: "prepared",
      preparedMax: Math.max(1, abilityMod + Math.floor(level / 2)),
    };
  }

  // Known casters
  if (["Bard", "Sorcerer", "Warlock", "Ranger"].includes(className)) {
    return {
      model: "known",
      knownMax: getKnownSpellsCount(className, level),
    };
  }

  return { model: "known", knownMax: 0 };
}

export function getLegalSpellPool(
  allSpells: SrdSpell[],
  access: ClassSpellAccess,
  maxSpellLevel: number
): SrdSpell[] {
  return allSpells.filter((spell) => {
    // Filter by level
    if ((spell.level || 0) > maxSpellLevel) return false;

    // Filter by class list
    const spellClasses = spell.classes || [];
    const isOnBaseList = spellClasses.some(
      (c) => c.toLowerCase() === access.baseList
    );
    const isOnExpandedList = access.expanded.some((exp) =>
      spell.name?.toLowerCase().includes(exp.toLowerCase())
    );

    return isOnBaseList || isOnExpandedList;
  });
}

export function isAutoPrepared(
  spellId: string,
  access: ClassSpellAccess
): boolean {
  return access.autoPrepared.some((s) => s.id === spellId);
}

export function getCantripScalingBreakpoint(characterLevel: number): string {
  if (characterLevel >= 17) return "17th level (4 dice)";
  if (characterLevel >= 11) return "11th level (3 dice)";
  if (characterLevel >= 5) return "5th level (2 dice)";
  return "1st level (1 die)";
}

/**
 * Heuristic: does a spell likely require *costly* material components (not covered by a focus/pouch)?
 * - Looks for "<number> gp" pattern or common costly indicators in the material text.
 */
export function spellHasCostlyComponents(spell: SrdSpell): boolean {
  const mat = ((spell as any).material || spell.description || "").toLowerCase();
  if (!mat) return false;
  if (/\b\d+\s*gp\b/.test(mat)) return true;
  if (/\bdia(?:mond|monds)\b/.test(mat)) return true;
  if (/\bpearl\b/.test(mat)) return true;
  if (/\bincense\b/.test(mat) && /\bworth\b/.test(mat)) return true;
  return false;
}
