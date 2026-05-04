/**
 * Centralized derived character stats.
 *
 * Single source of truth for values computed from a character's class lineup
 * (PB, hit dice by class, multiclass spell slots, display labels). All UI
 * — character sheet, level-up summary, dashboard cards — should call into
 * here instead of redoing the math locally.
 *
 * This module is pure (no Supabase calls). Pass it the result of
 * `getCharacterClasses` from `./classes`.
 */
import { DND_CLASSES, calculateProficiencyBonus } from "@/lib/dnd5e";
import {
  calculateMulticlassSpellcasterLevel,
  getMulticlassSpellSlots,
  FULL_CASTERS,
  HALF_CASTERS,
} from "@/lib/rules/multiclassRules";
import type { CharacterClassEntry } from "./classes";

/** Total character level = sum of all class levels (1..20). */
export function getTotalLevel(classes: Pick<CharacterClassEntry, "level">[]): number {
  const total = classes.reduce((sum, c) => sum + (c.level || 0), 0);
  return Math.max(1, Math.min(20, total));
}

/**
 * Proficiency bonus is based on TOTAL character level, never on individual
 * class level. (PHB p.15.) This is the single function the UI should use.
 */
export function getProficiencyBonus(
  classes: Pick<CharacterClassEntry, "level">[],
): number {
  return calculateProficiencyBonus(getTotalLevel(classes));
}

/** "Fighter 3 / Wizard 2" — primary class first. */
export function getClassBreakdown(
  classes: Pick<CharacterClassEntry, "className" | "level" | "isPrimary">[],
): string {
  if (!classes.length) return "—";
  const sorted = [...classes].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  return sorted.map((c) => `${c.className} ${c.level}`).join(" / ");
}

export interface HitDieGroup {
  /** e.g. "d10" */
  die: string;
  /** Number of dice of this size (sum across all classes that share the die) */
  count: number;
  /** Class names contributing to this group */
  classes: string[];
}

/**
 * Group hit dice by die size across classes.
 * Fighter 3 / Wizard 2 → [{die:"d10", count:3, classes:["Fighter"]}, {die:"d6", count:2, classes:["Wizard"]}]
 * Format with `formatHitDice` for display ("3d10 + 2d6").
 */
export function getHitDiceByClass(
  classes: Pick<CharacterClassEntry, "className" | "level">[],
): HitDieGroup[] {
  const map = new Map<number, HitDieGroup>();
  for (const cls of classes) {
    const def = DND_CLASSES.find((c) => c.value === cls.className);
    const die = def?.hitDie ?? 8;
    const existing = map.get(die);
    if (existing) {
      existing.count += cls.level;
      if (!existing.classes.includes(cls.className)) {
        existing.classes.push(cls.className);
      }
    } else {
      map.set(die, {
        die: `d${die}`,
        count: cls.level,
        classes: [cls.className],
      });
    }
  }
  // Largest die first for canonical display
  return [...map.values()].sort(
    (a, b) => parseInt(b.die.slice(1), 10) - parseInt(a.die.slice(1), 10),
  );
}

/** "3d10 + 2d6" */
export function formatHitDice(groups: HitDieGroup[]): string {
  if (!groups.length) return "—";
  return groups.map((g) => `${g.count}${g.die}`).join(" + ");
}

export interface SpellSlotsByLevel {
  /** spell-slot level (1..9) → number of slots */
  slots: Record<number, number>;
  /** Effective multiclass spellcaster level used to derive the slots */
  effectiveCasterLevel: number;
  /** True if at least one class contributes to multiclass spell slots */
  hasSlots: boolean;
  /** True if Warlock is in the lineup (pact slots are tracked separately) */
  hasPactMagic: boolean;
}

/**
 * Compute spell slots using the multiclass caster level table (PHB p.164),
 * EXCLUDING Warlock — Warlock pact slots remain separate.
 *
 * Special case: a single class that is a 1/3 caster (Eldritch Knight,
 * Arcane Trickster) below the threshold gets no slots.
 */
export function getSpellSlotsForClasses(
  classes: Pick<CharacterClassEntry, "className" | "level"> & { subclassName?: string }[] | Array<{
    className: string;
    level: number;
    subclassName?: string;
  }>,
): SpellSlotsByLevel {
  const arr = classes as Array<{
    className: string;
    level: number;
    subclassName?: string;
  }>;
  const hasPactMagic = arr.some((c) => c.className === "Warlock");
  const effective = calculateMulticlassSpellcasterLevel(
    arr.map((c) => ({
      className: c.className,
      level: c.level,
      subclass: c.subclassName,
    })),
  );
  const slots = effective > 0 ? getMulticlassSpellSlots(effective) : {};
  return {
    slots,
    effectiveCasterLevel: effective,
    hasSlots: Object.keys(slots).length > 0,
    hasPactMagic,
  };
}

/**
 * True if any class in the lineup grants spellcasting (full, half, or
 * recognized 1/3 caster subclass). Warlock counts as a caster even though
 * its slots are tracked separately.
 */
export function isAnySpellcaster(
  classes: Array<{ className: string; level: number; subclassName?: string }>,
): boolean {
  for (const c of classes) {
    if (FULL_CASTERS.includes(c.className)) return true;
    if (HALF_CASTERS.includes(c.className) && c.level >= 2) return true;
    if (c.className === "Warlock") return true;
    if (
      (c.className === "Fighter" && c.subclassName === "Eldritch Knight") ||
      (c.className === "Rogue" && c.subclassName === "Arcane Trickster")
    ) {
      if (c.level >= 3) return true;
    }
  }
  return false;
}
