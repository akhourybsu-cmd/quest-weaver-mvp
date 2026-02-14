import { MonsterFormData, getDefaultFormData } from "@/hooks/useMonsterForm";

export interface MonsterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  data: Partial<MonsterFormData>;
}

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: "brute",
    name: "Brute",
    description: "High HP, heavy melee damage, low AC",
    icon: "💪",
    data: {
      type: "humanoid",
      ac: 13,
      armorDescription: "natural armor",
      hpAvg: 45,
      hpFormula: "6d10+12",
      abilities: { str: 18, dex: 10, con: 14, int: 8, wis: 10, cha: 8 },
      speeds: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0 },
      actions: [
        { id: "1", name: "Greatclub", description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.", category: "action", attackBonus: 6, reach: "5 ft.", damageDice: "2d8+4", damageType: "bludgeoning" },
      ],
    },
  },
  {
    id: "skirmisher",
    name: "Skirmisher",
    description: "Fast, moderate damage, hit-and-run",
    icon: "⚡",
    data: {
      type: "humanoid",
      ac: 15,
      armorDescription: "leather armor",
      hpAvg: 27,
      hpFormula: "5d8+5",
      abilities: { str: 12, dex: 16, con: 12, int: 10, wis: 12, cha: 10 },
      speeds: { walk: 40, fly: 0, swim: 0, climb: 0, burrow: 0 },
      actions: [
        { id: "1", name: "Shortsword", description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.", category: "action", attackBonus: 5, reach: "5 ft.", damageDice: "1d6+3", damageType: "piercing" },
      ],
    },
  },
  {
    id: "controller",
    name: "Controller",
    description: "Crowd control, area effects, moderate defenses",
    icon: "🌀",
    data: {
      type: "aberration",
      ac: 14,
      hpAvg: 35,
      hpFormula: "6d8+8",
      abilities: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 },
      speeds: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0 },
      hasSpellcasting: true,
      spellcasting: { ability: "int", saveDC: 13, attackBonus: 5, mode: "innate", spells: {} },
    },
  },
  {
    id: "caster",
    name: "Caster",
    description: "Spell-focused, fragile, high spell save DC",
    icon: "🔮",
    data: {
      type: "humanoid",
      ac: 12,
      armorDescription: "mage armor",
      hpAvg: 22,
      hpFormula: "5d8",
      abilities: { str: 8, dex: 14, con: 10, int: 18, wis: 12, cha: 10 },
      speeds: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0 },
      hasSpellcasting: true,
      spellcasting: { ability: "int", saveDC: 14, attackBonus: 6, mode: "slots", spells: {} },
    },
  },
  {
    id: "boss",
    name: "Boss",
    description: "Legendary actions, high CR, multi-phase threat",
    icon: "👑",
    data: {
      cr: 10,
      type: "dragon",
      ac: 18,
      armorDescription: "natural armor",
      hpAvg: 178,
      hpFormula: "17d12+68",
      abilities: { str: 20, dex: 10, con: 18, int: 14, wis: 12, cha: 16 },
      speeds: { walk: 40, fly: 80, swim: 0, climb: 0, burrow: 0 },
      saveProficiencies: { str: false, dex: true, con: true, int: false, wis: true, cha: true },
      actions: [
        { id: "1", name: "Multiattack", description: "The creature makes three attacks: one with its bite and two with its claws.", category: "action" },
        { id: "2", name: "Bite", description: "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) piercing damage.", category: "action", attackBonus: 9, reach: "10 ft.", damageDice: "2d10+5", damageType: "piercing" },
        { id: "3", name: "Tail Attack", description: "The creature makes a tail attack.", category: "legendary" },
      ],
    },
  },
];
