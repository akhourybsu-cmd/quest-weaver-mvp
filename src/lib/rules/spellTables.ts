import type { SrdClass } from "../srd/SRDClient";

/**
 * Return class-specific known/prepared counts at level.
 * Based on 5e SRD spellcasting progression tables.
 */
export function spellKnownPrepared(cls: SrdClass, level: number): { known: number; prepared: number } {
  const prog = cls.spellcasting_progression;
  
  if (!prog) {
    return { known: 0, prepared: 0 };
  }
  
  // Prepared casters (Cleric, Druid, Paladin, Wizard)
  if (prog === "prepared" || prog === "full") {
    // Prepared = level + ability modifier (we'll show this in UI, base it on level for now)
    return { known: 0, prepared: Math.max(1, level) };
  }
  
  // Known casters (Bard, Sorcerer, Warlock, Ranger)
  if (prog === "known") {
    const knownByLevel = [
      0,  // Level 0
      4,  // Level 1
      5,  // Level 2
      6,  // Level 3
      7,  // Level 4
      8,  // Level 5
      9,  // Level 6
      10, // Level 7
      11, // Level 8
      12, // Level 9
      14, // Level 10
      15, // Level 11
      15, // Level 12
      16, // Level 13
      18, // Level 14
      19, // Level 15
      19, // Level 16
      20, // Level 17
      22, // Level 18
      22, // Level 19
      22, // Level 20
    ];
    return { 
      known: knownByLevel[Math.min(level, knownByLevel.length - 1)] || 0, 
      prepared: 0 
    };
  }
  
  // Half casters (Paladin, Ranger) - if they use known
  if (prog === "half") {
    const halfKnownByLevel = [
      0, 0, // Levels 0-1
      2,    // Level 2
      3,    // Level 3
      3,    // Level 4
      4,    // Level 5
      4,    // Level 6
      5,    // Level 7
      5,    // Level 8
      6,    // Level 9
      6,    // Level 10
      7,    // Level 11
      7,    // Level 12
      8,    // Level 13
      8,    // Level 14
      9,    // Level 15
      9,    // Level 16
      10,   // Level 17
      10,   // Level 18
      11,   // Level 19
      11,   // Level 20
    ];
    return { 
      known: halfKnownByLevel[Math.min(level, halfKnownByLevel.length - 1)] || 0, 
      prepared: 0 
    };
  }
  
  // Third casters (Eldritch Knight, Arcane Trickster)
  if (prog === "third") {
    const thirdKnownByLevel = [
      0, 0, 0, // Levels 0-2
      2,       // Level 3
      3,       // Level 4
      3,       // Level 5
      3,       // Level 6
      4,       // Level 7
      4,       // Level 8
      4,       // Level 9
      5,       // Level 10
      6,       // Level 11
      6,       // Level 12
      7,       // Level 13
      7,       // Level 14
      7,       // Level 15
      8,       // Level 16
      8,       // Level 17
      8,       // Level 18
      9,       // Level 19
      9,       // Level 20
    ];
    return { 
      known: thirdKnownByLevel[Math.min(level, thirdKnownByLevel.length - 1)] || 0, 
      prepared: 0 
    };
  }
  
  return { known: 0, prepared: 0 };
}
