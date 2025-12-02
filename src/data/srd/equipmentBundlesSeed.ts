// SRD Starting Equipment Bundles for each class
// Based on D&D 5E SRD starting equipment options

export interface EquipmentBundle {
  id: string;
  label: string;
  items: Array<{ name: string; qty?: number }>;
}

export interface ClassEquipmentData {
  className: string;
  bundles: EquipmentBundle[];
  default: Array<{ name: string; qty?: number }>;
}

export const EQUIPMENT_BUNDLES: ClassEquipmentData[] = [
  {
    className: "Barbarian",
    bundles: [
      {
        id: "greataxe",
        label: "Option A: Greataxe",
        items: [
          { name: "Greataxe" },
          { name: "Handaxe", qty: 2 },
          { name: "Explorer's Pack" },
          { name: "Javelin", qty: 4 }
        ]
      },
      {
        id: "martial",
        label: "Option B: Two Martial Weapons",
        items: [
          { name: "Any Martial Melee Weapon", qty: 2 },
          { name: "Handaxe", qty: 2 },
          { name: "Explorer's Pack" },
          { name: "Javelin", qty: 4 }
        ]
      }
    ],
    default: [
      { name: "Greataxe" },
      { name: "Explorer's Pack" },
      { name: "Javelin", qty: 4 }
    ]
  },
  {
    className: "Bard",
    bundles: [
      {
        id: "rapier",
        label: "Option A: Rapier",
        items: [
          { name: "Rapier" },
          { name: "Diplomat's Pack" },
          { name: "Lute" },
          { name: "Leather Armor" },
          { name: "Dagger" }
        ]
      },
      {
        id: "longsword",
        label: "Option B: Longsword",
        items: [
          { name: "Longsword" },
          { name: "Entertainer's Pack" },
          { name: "Any Musical Instrument" },
          { name: "Leather Armor" },
          { name: "Dagger" }
        ]
      },
      {
        id: "simple",
        label: "Option C: Simple Weapon",
        items: [
          { name: "Any Simple Weapon" },
          { name: "Diplomat's Pack" },
          { name: "Any Musical Instrument" },
          { name: "Leather Armor" },
          { name: "Dagger" }
        ]
      }
    ],
    default: [
      { name: "Rapier" },
      { name: "Diplomat's Pack" },
      { name: "Lute" },
      { name: "Leather Armor" },
      { name: "Dagger" }
    ]
  },
  {
    className: "Cleric",
    bundles: [
      {
        id: "mace-scale",
        label: "Option A: Mace & Scale Mail",
        items: [
          { name: "Mace" },
          { name: "Scale Mail" },
          { name: "Shield" },
          { name: "Light Crossbow" },
          { name: "Crossbow Bolts", qty: 20 },
          { name: "Priest's Pack" },
          { name: "Holy Symbol" }
        ]
      },
      {
        id: "warhammer-chain",
        label: "Option B: Warhammer & Chain Mail",
        items: [
          { name: "Warhammer" },
          { name: "Chain Mail" },
          { name: "Shield" },
          { name: "Light Crossbow" },
          { name: "Crossbow Bolts", qty: 20 },
          { name: "Explorer's Pack" },
          { name: "Holy Symbol" }
        ]
      }
    ],
    default: [
      { name: "Mace" },
      { name: "Scale Mail" },
      { name: "Shield" },
      { name: "Priest's Pack" },
      { name: "Holy Symbol" }
    ]
  },
  {
    className: "Druid",
    bundles: [
      {
        id: "shield",
        label: "Option A: Wooden Shield",
        items: [
          { name: "Wooden Shield" },
          { name: "Scimitar" },
          { name: "Leather Armor" },
          { name: "Explorer's Pack" },
          { name: "Druidic Focus" }
        ]
      },
      {
        id: "simple",
        label: "Option B: Simple Melee Weapon",
        items: [
          { name: "Any Simple Melee Weapon" },
          { name: "Any Simple Weapon" },
          { name: "Leather Armor" },
          { name: "Explorer's Pack" },
          { name: "Druidic Focus" }
        ]
      }
    ],
    default: [
      { name: "Wooden Shield" },
      { name: "Scimitar" },
      { name: "Leather Armor" },
      { name: "Explorer's Pack" },
      { name: "Druidic Focus" }
    ]
  },
  {
    className: "Fighter",
    bundles: [
      {
        id: "chain-martial",
        label: "Option A: Chain Mail & Martial Weapon",
        items: [
          { name: "Chain Mail" },
          { name: "Any Martial Weapon" },
          { name: "Shield" },
          { name: "Light Crossbow" },
          { name: "Crossbow Bolts", qty: 20 },
          { name: "Dungeoneer's Pack" }
        ]
      },
      {
        id: "leather-longbow",
        label: "Option B: Leather Armor & Longbow",
        items: [
          { name: "Leather Armor" },
          { name: "Longbow" },
          { name: "Arrows", qty: 20 },
          { name: "Any Martial Weapon", qty: 2 },
          { name: "Explorer's Pack" }
        ]
      }
    ],
    default: [
      { name: "Chain Mail" },
      { name: "Longsword" },
      { name: "Shield" },
      { name: "Dungeoneer's Pack" }
    ]
  },
  {
    className: "Monk",
    bundles: [
      {
        id: "shortsword",
        label: "Option A: Shortsword",
        items: [
          { name: "Shortsword" },
          { name: "Dungeoneer's Pack" },
          { name: "Dart", qty: 10 }
        ]
      },
      {
        id: "simple",
        label: "Option B: Simple Weapon",
        items: [
          { name: "Any Simple Weapon" },
          { name: "Explorer's Pack" },
          { name: "Dart", qty: 10 }
        ]
      }
    ],
    default: [
      { name: "Shortsword" },
      { name: "Dungeoneer's Pack" },
      { name: "Dart", qty: 10 }
    ]
  },
  {
    className: "Paladin",
    bundles: [
      {
        id: "martial-shield",
        label: "Option A: Martial Weapon & Shield",
        items: [
          { name: "Any Martial Weapon" },
          { name: "Shield" },
          { name: "Chain Mail" },
          { name: "Javelin", qty: 5 },
          { name: "Priest's Pack" },
          { name: "Holy Symbol" }
        ]
      },
      {
        id: "two-martial",
        label: "Option B: Two Martial Weapons",
        items: [
          { name: "Any Martial Weapon", qty: 2 },
          { name: "Chain Mail" },
          { name: "Javelin", qty: 5 },
          { name: "Explorer's Pack" },
          { name: "Holy Symbol" }
        ]
      }
    ],
    default: [
      { name: "Longsword" },
      { name: "Shield" },
      { name: "Chain Mail" },
      { name: "Javelin", qty: 5 },
      { name: "Priest's Pack" },
      { name: "Holy Symbol" }
    ]
  },
  {
    className: "Ranger",
    bundles: [
      {
        id: "scale-two-shortswords",
        label: "Option A: Scale Mail & Two Shortswords",
        items: [
          { name: "Scale Mail" },
          { name: "Shortsword", qty: 2 },
          { name: "Longbow" },
          { name: "Arrows", qty: 20 },
          { name: "Dungeoneer's Pack" }
        ]
      },
      {
        id: "leather-simple",
        label: "Option B: Leather Armor & Simple Weapons",
        items: [
          { name: "Leather Armor" },
          { name: "Any Simple Melee Weapon", qty: 2 },
          { name: "Longbow" },
          { name: "Arrows", qty: 20 },
          { name: "Explorer's Pack" }
        ]
      }
    ],
    default: [
      { name: "Scale Mail" },
      { name: "Shortsword", qty: 2 },
      { name: "Longbow" },
      { name: "Arrows", qty: 20 },
      { name: "Dungeoneer's Pack" }
    ]
  },
  {
    className: "Rogue",
    bundles: [
      {
        id: "rapier",
        label: "Option A: Rapier",
        items: [
          { name: "Rapier" },
          { name: "Shortbow" },
          { name: "Arrows", qty: 20 },
          { name: "Burglar's Pack" },
          { name: "Leather Armor" },
          { name: "Dagger", qty: 2 },
          { name: "Thieves' Tools" }
        ]
      },
      {
        id: "shortsword",
        label: "Option B: Shortsword",
        items: [
          { name: "Shortsword" },
          { name: "Shortbow" },
          { name: "Arrows", qty: 20 },
          { name: "Dungeoneer's Pack" },
          { name: "Leather Armor" },
          { name: "Dagger", qty: 2 },
          { name: "Thieves' Tools" }
        ]
      }
    ],
    default: [
      { name: "Rapier" },
      { name: "Shortbow" },
      { name: "Arrows", qty: 20 },
      { name: "Burglar's Pack" },
      { name: "Leather Armor" },
      { name: "Dagger", qty: 2 },
      { name: "Thieves' Tools" }
    ]
  },
  {
    className: "Sorcerer",
    bundles: [
      {
        id: "light-crossbow",
        label: "Option A: Light Crossbow",
        items: [
          { name: "Light Crossbow" },
          { name: "Crossbow Bolts", qty: 20 },
          { name: "Arcane Focus" },
          { name: "Dungeoneer's Pack" },
          { name: "Dagger", qty: 2 }
        ]
      },
      {
        id: "simple",
        label: "Option B: Simple Weapon",
        items: [
          { name: "Any Simple Weapon" },
          { name: "Component Pouch" },
          { name: "Explorer's Pack" },
          { name: "Dagger", qty: 2 }
        ]
      }
    ],
    default: [
      { name: "Light Crossbow" },
      { name: "Crossbow Bolts", qty: 20 },
      { name: "Arcane Focus" },
      { name: "Dungeoneer's Pack" },
      { name: "Dagger", qty: 2 }
    ]
  },
  {
    className: "Warlock",
    bundles: [
      {
        id: "light-crossbow",
        label: "Option A: Light Crossbow",
        items: [
          { name: "Light Crossbow" },
          { name: "Crossbow Bolts", qty: 20 },
          { name: "Arcane Focus" },
          { name: "Scholar's Pack" },
          { name: "Leather Armor" },
          { name: "Any Simple Weapon" },
          { name: "Dagger", qty: 2 }
        ]
      },
      {
        id: "simple",
        label: "Option B: Simple Weapons",
        items: [
          { name: "Any Simple Weapon" },
          { name: "Component Pouch" },
          { name: "Dungeoneer's Pack" },
          { name: "Leather Armor" },
          { name: "Any Simple Weapon" },
          { name: "Dagger", qty: 2 }
        ]
      }
    ],
    default: [
      { name: "Light Crossbow" },
      { name: "Crossbow Bolts", qty: 20 },
      { name: "Arcane Focus" },
      { name: "Scholar's Pack" },
      { name: "Leather Armor" },
      { name: "Dagger", qty: 2 }
    ]
  },
  {
    className: "Wizard",
    bundles: [
      {
        id: "quarterstaff",
        label: "Option A: Quarterstaff",
        items: [
          { name: "Quarterstaff" },
          { name: "Component Pouch" },
          { name: "Scholar's Pack" },
          { name: "Spellbook" }
        ]
      },
      {
        id: "dagger",
        label: "Option B: Dagger",
        items: [
          { name: "Dagger" },
          { name: "Arcane Focus" },
          { name: "Explorer's Pack" },
          { name: "Spellbook" }
        ]
      }
    ],
    default: [
      { name: "Quarterstaff" },
      { name: "Component Pouch" },
      { name: "Scholar's Pack" },
      { name: "Spellbook" }
    ]
  }
];

export function getEquipmentBundlesForClass(className: string): ClassEquipmentData | undefined {
  return EQUIPMENT_BUNDLES.find(e => e.className.toLowerCase() === className.toLowerCase());
}
