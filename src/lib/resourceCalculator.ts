import { getSpellSlotInfo } from "./rules/spellRules";

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface ClassResource {
  name: string;
  total: number;
  used: number;
  resetOn: "short" | "long";
}

export interface CharacterResources {
  spellSlots: SpellSlot[];
  classResources: ClassResource[];
}

// Class-specific resources based on D&D 5e rules
const CLASS_RESOURCES: Record<string, (level: number) => ClassResource[]> = {
  Barbarian: (level) => [
    {
      name: "Rage",
      total: level < 3 ? 2 : level < 6 ? 3 : level < 12 ? 4 : level < 17 ? 5 : level < 20 ? 6 : 999,
      used: 0,
      resetOn: "long",
    },
  ],
  Monk: (level) => [
    {
      name: "Ki Points",
      total: level,
      used: 0,
      resetOn: "short",
    },
  ],
  Fighter: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Action Surge",
        total: level < 17 ? 1 : 2,
        used: 0,
        resetOn: "short",
      });
    }
    if (level >= 9) {
      resources.push({
        name: "Indomitable",
        total: level < 13 ? 1 : level < 17 ? 2 : 3,
        used: 0,
        resetOn: "long",
      });
    }
    return resources;
  },
  Bard: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Bardic Inspiration",
        total: Math.max(1, Math.floor((level - 1) / 4) + 3), // Cha modifier approximation
        used: 0,
        resetOn: level < 5 ? "long" : "short",
      });
    }
    return resources;
  },
  Cleric: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Channel Divinity",
        total: level < 6 ? 1 : level < 18 ? 2 : 3,
        used: 0,
        resetOn: "short",
      });
    }
    return resources;
  },
  Druid: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Wild Shape",
        total: 2,
        used: 0,
        resetOn: "short",
      });
    }
    return resources;
  },
  Paladin: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 3) {
      resources.push({
        name: "Channel Divinity",
        total: 1,
        used: 0,
        resetOn: "short",
      });
    }
    return resources;
  },
  Ranger: (level) => [],
  Rogue: (level) => [],
  Sorcerer: (level) => [
    {
      name: "Sorcery Points",
      total: level,
      used: 0,
      resetOn: "long",
    },
  ],
  Warlock: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Invocations",
        total: Math.floor((level + 1) / 3) + 2,
        used: 0,
        resetOn: "long",
      });
    }
    return resources;
  },
  Wizard: (level) => {
    const resources: ClassResource[] = [];
    if (level >= 2) {
      resources.push({
        name: "Arcane Recovery",
        total: 1,
        used: 0,
        resetOn: "long",
      });
    }
    return resources;
  },
};

/**
 * Calculate spell slots and class resources for a character based on class and level
 */
export function calculateCharacterResources(
  className: string,
  level: number
): CharacterResources {
  const resources: CharacterResources = {
    spellSlots: [],
    classResources: [],
  };

  // Calculate spell slots
  const slotInfo = getSpellSlotInfo([{ className, level }]);

  // Add shared spell slots (standard casters)
  if (slotInfo.shared) {
    Object.entries(slotInfo.shared.slots).forEach(([slotLevel, count]) => {
      resources.spellSlots.push({
        level: parseInt(slotLevel),
        total: count,
        used: 0,
      });
    });
  }

  // Add pact magic slots (Warlock)
  if (slotInfo.pact) {
    resources.spellSlots.push({
      level: slotInfo.pact.pactSlotLevel,
      total: slotInfo.pact.pactSlots,
      used: 0,
    });
  }

  // Add class-specific resources
  const resourceGenerator = CLASS_RESOURCES[className];
  if (resourceGenerator) {
    resources.classResources = resourceGenerator(level);
  }

  return resources;
}

/**
 * Restore resources based on rest type
 */
export function restoreResources(
  resources: CharacterResources,
  restType: "short" | "long"
): CharacterResources {
  const restored: CharacterResources = {
    spellSlots: resources.spellSlots.map((slot) => ({
      ...slot,
      used: restType === "long" ? 0 : slot.used, // Only long rest restores spell slots
    })),
    classResources: resources.classResources.map((resource) => ({
      ...resource,
      used:
        restType === "long" || resource.resetOn === "short"
          ? 0
          : resource.used,
    })),
  };

  return restored;
}

/**
 * Get a human-readable description of when a resource resets
 */
export function getResourceResetDescription(resetOn: "short" | "long"): string {
  return resetOn === "short" ? "Resets on Short Rest" : "Resets on Long Rest";
}
