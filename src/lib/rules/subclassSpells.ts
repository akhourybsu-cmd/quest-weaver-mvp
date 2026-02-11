// SRD-only auto-prepared spell lists by subclass.
// Key format: "ClassName:SubclassName"
// Value: Record of class level -> array of spell names auto-prepared at that level.
// If a spell name is not present in your SRD table, consumer code will filter it out gracefully.

export const AUTO_PREPARED_BY_SUBCLASS: Record<string, Record<number, string[]>> = {
  "Cleric:Life Domain": {
    1: ["Bless", "Cure Wounds"],
    3: ["Lesser Restoration", "Spiritual Weapon"],
    5: ["Beacon of Hope", "Revivify"],
    7: ["Death Ward", "Guardian of Faith"],
    9: ["Mass Cure Wounds", "Raise Dead"],
  },
  "Paladin:Oath of Devotion": {
    3: ["Protection from Evil and Good", "Sanctuary"],
    5: ["Lesser Restoration", "Zone of Truth"],
    9: ["Beacon of Hope", "Dispel Magic"],
    13: ["Freedom of Movement", "Guardian of Faith"],
    17: ["Commune", "Flame Strike"],
  },
  "Druid:Circle of the Land": {
    // Circle of the Land spells vary by terrain chosen.
    // These are Arctic as default SRD example; could be extended per terrain choice.
    3: ["Hold Person", "Spike Growth"],
    5: ["Sleet Storm", "Slow"],
    7: ["Freedom of Movement", "Ice Storm"],
    9: ["Commune with Nature", "Cone of Cold"],
  },
};

/**
 * Third-caster subclass spell school restrictions (SRD).
 * Eldritch Knight: Abjuration and Evocation (plus unrestricted picks at 3, 8, 14, 20)
 * Arcane Trickster: Enchantment and Illusion (plus unrestricted picks at 3, 8, 14, 20)
 */
export const THIRD_CASTER_SCHOOL_RESTRICTIONS: Record<string, string[]> = {
  "Eldritch Knight": ["Abjuration", "Evocation"],
  "Arcane Trickster": ["Enchantment", "Illusion"],
};

/** Levels at which third-casters can choose spells from ANY school */
export const THIRD_CASTER_UNRESTRICTED_LEVELS = [3, 8, 14, 20];

/**
 * Third-caster cantrip progression (same for both EK and AT)
 * Level 3: 2 cantrips, Level 10: 3 cantrips
 */
export const THIRD_CASTER_CANTRIP_PROGRESSION: Record<number, number> = {
  3: 2,
  10: 3,
};

/**
 * Third-caster spells known progression
 * Index = class level, value = total spells known
 */
export const THIRD_CASTER_SPELLS_KNOWN = [
  0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13
];

/**
 * Max spell level for third-casters based on class level
 */
export function getThirdCasterMaxSpellLevel(classLevel: number): number {
  if (classLevel >= 19) return 4;
  if (classLevel >= 13) return 3;
  if (classLevel >= 7) return 2;
  if (classLevel >= 3) return 1;
  return 0;
}
