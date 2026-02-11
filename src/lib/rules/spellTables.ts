import type { SrdClass } from "../srd/SRDClient";

// ==================== PER-CLASS KNOWN SPELL TABLES ====================

const BARD_KNOWN =     [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
const SORCERER_KNOWN = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
const WARLOCK_KNOWN =  [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
const RANGER_KNOWN =   [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];

// Third-caster subclasses (Eldritch Knight, Arcane Trickster)
const THIRD_CASTER_KNOWN = [0, 0, 0, 2, 3, 3, 3, 4, 4, 4, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9];

// Half-caster known (Paladin uses prepared, so this is mainly Ranger backup)
const HALF_CASTER_KNOWN = [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];

function getKnownByClass(className: string, level: number): number {
  const idx = Math.min(level, 20);
  switch (className) {
    case "Bard": return BARD_KNOWN[idx] || 0;
    case "Sorcerer": return SORCERER_KNOWN[idx] || 0;
    case "Warlock": return WARLOCK_KNOWN[idx] || 0;
    case "Ranger": return RANGER_KNOWN[idx] || 0;
    default: return 0;
  }
}

/**
 * Return class-specific known/prepared counts at level.
 * Based on 5e SRD spellcasting progression tables.
 */
export function spellKnownPrepared(cls: SrdClass, level: number, className?: string): { known: number; prepared: number } {
  const prog = cls.spellcasting_progression;
  
  if (!prog) {
    return { known: 0, prepared: 0 };
  }
  
  // Prepared casters (Cleric, Druid, Paladin, Wizard)
  if (prog === "prepared" || prog === "full") {
    return { known: 0, prepared: Math.max(1, level) };
  }
  
  // Known casters -- use per-class tables
  if (prog === "known") {
    const name = className || cls.name || "";
    const known = getKnownByClass(name, level);
    // Fallback to Bard table if class name not matched
    return { 
      known: known > 0 ? known : BARD_KNOWN[Math.min(level, 20)] || 0, 
      prepared: 0 
    };
  }
  
  // Half casters
  if (prog === "half") {
    return { 
      known: HALF_CASTER_KNOWN[Math.min(level, HALF_CASTER_KNOWN.length - 1)] || 0, 
      prepared: 0 
    };
  }
  
  // Third casters (Eldritch Knight, Arcane Trickster)
  if (prog === "third") {
    return { 
      known: THIRD_CASTER_KNOWN[Math.min(level, THIRD_CASTER_KNOWN.length - 1)] || 0, 
      prepared: 0 
    };
  }
  
  return { known: 0, prepared: 0 };
}
