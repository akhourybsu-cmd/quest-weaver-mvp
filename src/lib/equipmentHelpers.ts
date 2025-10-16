// Equipment and starting gear helpers

export interface ArmorInfo {
  base_ac: number;
  dex_cap: number | null; // null = heavy armor (no dex bonus)
  strength_required: number | null;
  stealth_disadvantage: boolean;
  category: 'Light' | 'Medium' | 'Heavy' | 'Shield';
}

export interface WeaponInfo {
  category: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged';
  damage: string;
  damage_type: string;
  properties: string[];
}

/**
 * Calculate AC from armor, dexterity, and shield
 */
export const calculateACFromEquipment = (
  dexScore: number,
  armor?: ArmorInfo,
  hasShield: boolean = false
): number => {
  const dexMod = Math.floor((dexScore - 10) / 2);
  let ac = 10;

  if (armor) {
    ac = armor.base_ac;
    
    // Add dex modifier based on armor category
    if (armor.category === 'Light') {
      // Light armor: full dex bonus
      ac += dexMod;
    } else if (armor.category === 'Medium') {
      // Medium armor: dex bonus capped at +2
      ac += Math.min(dexMod, armor.dex_cap || 2);
    }
    // Heavy armor: no dex bonus
  } else {
    // Unarmored: 10 + full dex modifier
    ac = 10 + dexMod;
  }

  // Shield adds +2
  if (hasShield) {
    ac += 2;
  }

  return ac;
};

/**
 * Parse class starting equipment into selectable options
 * Format: "Pack 1: (a) Item A or (b) Item B, and (c) Item C or (d) Item D"
 */
export interface EquipmentChoice {
  id: string;
  label: string;
  options: EquipmentOption[];
  selected?: string;
}

export interface EquipmentOption {
  id: string;
  label: string;
  items: string[];
}

export const parseStartingEquipment = (equipmentText: string | any): EquipmentChoice[] => {
  if (typeof equipmentText !== 'string') {
    return [];
  }

  const choices: EquipmentChoice[] = [];
  
  // Split by major separators (numbered packs or line breaks)
  const sections = equipmentText.split(/\n|Pack \d+:/);
  
  sections.forEach((section, sectionIdx) => {
    if (!section.trim()) return;

    // Look for (a) ... or (b) ... patterns
    const optionMatches = section.match(/\([a-z]\)[^(]*/g);
    
    if (optionMatches && optionMatches.length > 1) {
      const options: EquipmentOption[] = optionMatches.map((opt, idx) => {
        const letter = opt.match(/\(([a-z])\)/)?.[1] || '';
        const items = opt
          .replace(/\([a-z]\)/, '')
          .trim()
          .split(/,| and /)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        return {
          id: letter,
          label: opt.trim(),
          items,
        };
      });

      choices.push({
        id: `choice_${sectionIdx}`,
        label: `Choice ${choices.length + 1}`,
        options,
      });
    }
  });

  return choices;
};

/**
 * Common starting packs
 */
export const STARTING_PACKS = {
  "Burglar's Pack": ["backpack", "ball bearings (1,000)", "10 feet of string", "bell", "5 candles", "crowbar", "hammer", "10 pitons", "hooded lantern", "2 flasks of oil", "5 days rations", "tinderbox", "waterskin", "50 feet hempen rope"],
  "Diplomat's Pack": ["chest", "2 cases for maps and scrolls", "fine clothes", "bottle of ink", "ink pen", "lamp", "2 flasks of oil", "5 sheets of paper", "vial of perfume", "sealing wax", "soap"],
  "Dungeoneer's Pack": ["backpack", "crowbar", "hammer", "10 pitons", "10 torches", "tinderbox", "10 days of rations", "waterskin", "50 feet of hempen rope"],
  "Entertainer's Pack": ["backpack", "bedroll", "2 costumes", "5 candles", "5 days of rations", "waterskin", "disguise kit"],
  "Explorer's Pack": ["backpack", "bedroll", "mess kit", "tinderbox", "10 torches", "10 days of rations", "waterskin", "50 feet of hempen rope"],
  "Priest's Pack": ["backpack", "blanket", "10 candles", "tinderbox", "alms box", "2 blocks of incense", "censer", "vestments", "2 days of rations", "waterskin"],
  "Scholar's Pack": ["backpack", "book of lore", "bottle of ink", "ink pen", "10 sheets of parchment", "little bag of sand", "small knife"],
};

/**
 * Expand pack names to item lists
 */
export const expandEquipmentPack = (packName: string): string[] => {
  const normalizedName = packName.trim();
  return STARTING_PACKS[normalizedName as keyof typeof STARTING_PACKS] || [packName];
};
