import {
  THIRD_CASTER_CANTRIP_PROGRESSION,
  THIRD_CASTER_SPELLS_KNOWN,
  getThirdCasterMaxSpellLevel,
} from "./subclassSpells";

/** Names of subclasses that grant third-caster spellcasting */
export const THIRD_CASTER_SUBCLASS_NAMES = ["Eldritch Knight", "Arcane Trickster"];

/** Check if a subclass name is a third-caster */
export function isThirdCasterSubclass(subclassName: string | null | undefined): boolean {
  if (!subclassName) return false;
  return THIRD_CASTER_SUBCLASS_NAMES.includes(subclassName);
}

/** Get cantrip count at a given class level for third-casters */
export function getThirdCasterCantripCount(classLevel: number): number {
  const levels = Object.keys(THIRD_CASTER_CANTRIP_PROGRESSION)
    .map(Number)
    .sort((a, b) => b - a);
  for (const l of levels) {
    if (classLevel >= l) return THIRD_CASTER_CANTRIP_PROGRESSION[l];
  }
  return 0;
}

/** Get cantrip gain when leveling from one level to another */
export function getThirdCasterCantripGain(fromLevel: number, toLevel: number): number {
  return getThirdCasterCantripCount(toLevel) - getThirdCasterCantripCount(fromLevel);
}

/** Get total spells known at a class level */
export function getThirdCasterSpellsKnown(classLevel: number): number {
  return THIRD_CASTER_SPELLS_KNOWN[Math.min(classLevel, 20)] || 0;
}

/** Get spells known gain when leveling */
export function getThirdCasterSpellsKnownGain(fromLevel: number, toLevel: number): number {
  return getThirdCasterSpellsKnown(toLevel) - getThirdCasterSpellsKnown(fromLevel);
}

export { getThirdCasterMaxSpellLevel };
