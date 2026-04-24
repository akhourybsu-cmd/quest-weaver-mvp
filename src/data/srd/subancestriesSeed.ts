// Complete SRD Subancestries (Subraces) Data
// Based on 5E SRD (System Reference Document)

export interface SubancestrySeed {
  ancestry_name: string;
  name: string;
  ability_bonuses: Array<{ ability: string; bonus: number }>;
  traits: Array<{ name: string; description: string }>;
  proficiencies?: Array<{ name: string; type: string }>;
  languages?: Array<{ name: string }>;
}

export const SUBANCESTRIES_SRD: SubancestrySeed[] = [
  // =============== DWARF SUBRACES ===============
  {
    ancestry_name: "Dwarf",
    name: "Hill Dwarf",
    ability_bonuses: [{ ability: "wis", bonus: 1 }],
    traits: [
      { name: "Dwarven Toughness", description: "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level." }
    ]
  },
  {
    ancestry_name: "Dwarf",
    name: "Mountain Dwarf",
    ability_bonuses: [{ ability: "str", bonus: 2 }],
    traits: [
      { name: "Dwarven Armor Training", description: "You have proficiency with light and medium armor." }
    ],
    proficiencies: [
      { name: "Light Armor", type: "armor" },
      { name: "Medium Armor", type: "armor" }
    ]
  },

  // =============== ELF SUBRACES ===============
  {
    ancestry_name: "Elf",
    name: "High Elf",
    ability_bonuses: [{ ability: "int", bonus: 1 }],
    traits: [
      { name: "Elf Weapon Training", description: "You have proficiency with the longsword, shortsword, shortbow, and longbow." },
      { name: "Cantrip", description: "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it." },
      { name: "Extra Language", description: "You can speak, read, and write one extra language of your choice." }
    ],
    proficiencies: [
      { name: "Longsword", type: "weapon" },
      { name: "Shortsword", type: "weapon" },
      { name: "Shortbow", type: "weapon" },
      { name: "Longbow", type: "weapon" }
    ]
  },
  {
    ancestry_name: "Elf",
    name: "Wood Elf",
    ability_bonuses: [{ ability: "wis", bonus: 1 }],
    traits: [
      { name: "Elf Weapon Training", description: "You have proficiency with the longsword, shortsword, shortbow, and longbow." },
      { name: "Fleet of Foot", description: "Your base walking speed increases to 35 feet." },
      { name: "Mask of the Wild", description: "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena." }
    ],
    proficiencies: [
      { name: "Longsword", type: "weapon" },
      { name: "Shortsword", type: "weapon" },
      { name: "Shortbow", type: "weapon" },
      { name: "Longbow", type: "weapon" }
    ]
  },
  {
    ancestry_name: "Elf",
    name: "Drow",
    ability_bonuses: [{ ability: "cha", bonus: 1 }],
    traits: [
      { name: "Superior Darkvision", description: "Your darkvision has a radius of 120 feet." },
      { name: "Sunlight Sensitivity", description: "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight." },
      { name: "Drow Magic", description: "You know the dancing lights cantrip. When you reach 3rd level, you can cast the faerie fire spell once per day. When you reach 5th level, you can also cast the darkness spell once per day. Charisma is your spellcasting ability for these spells." },
      { name: "Drow Weapon Training", description: "You have proficiency with rapiers, shortswords, and hand crossbows." }
    ],
    proficiencies: [
      { name: "Rapier", type: "weapon" },
      { name: "Shortsword", type: "weapon" },
      { name: "Hand Crossbow", type: "weapon" }
    ]
  },

  // =============== HALFLING SUBRACES ===============
  {
    ancestry_name: "Halfling",
    name: "Lightfoot",
    ability_bonuses: [{ ability: "cha", bonus: 1 }],
    traits: [
      { name: "Naturally Stealthy", description: "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you." }
    ]
  },
  {
    ancestry_name: "Halfling",
    name: "Stout",
    ability_bonuses: [{ ability: "con", bonus: 1 }],
    traits: [
      { name: "Stout Resilience", description: "You have advantage on saving throws against poison, and you have resistance against poison damage." }
    ]
  },

  // =============== GNOME SUBRACES ===============
  {
    ancestry_name: "Gnome",
    name: "Rock Gnome",
    ability_bonuses: [{ ability: "con", bonus: 1 }],
    traits: [
      { name: "Artificer's Lore", description: "Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply." },
      { name: "Tinker", description: "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp). The device ceases to function after 24 hours (unless you spend 1 hour repairing it to keep the device functioning), or when you use your action to dismantle it. You can have up to three such devices active at a time. Options: Clockwork Toy, Fire Starter, Music Box." }
    ],
    proficiencies: [
      { name: "Tinker's Tools", type: "tool" }
    ]
  },
  {
    ancestry_name: "Gnome",
    name: "Forest Gnome",
    ability_bonuses: [{ ability: "dex", bonus: 1 }],
    traits: [
      { name: "Natural Illusionist", description: "You know the minor illusion cantrip. Intelligence is your spellcasting ability for it." },
      { name: "Speak with Small Beasts", description: "Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts." }
    ]
  },

  // =============== DRAGONBORN - No subraces in base SRD ===============
  // Dragonborn have draconic ancestry choices built into the main race

  // =============== HALF-ELF - No subraces in base SRD ===============
  // Half-Elves have skill versatility choices built into the main race

  // =============== HALF-ORC - No subraces in base SRD ===============

  // =============== HUMAN - No subraces in base SRD ===============
  // Variant Human is sometimes used but is optional rule

  // =============== TIEFLING - No subraces in base SRD ===============
];
