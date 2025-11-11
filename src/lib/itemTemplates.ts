// Pre-built item templates for quick creation

export const ITEM_TEMPLATES = {
  weapons: {
    "Longsword": {
      type: "WEAPON",
      category: "Martial Melee",
      subtype: "Longsword",
      currency: { cp: 0, sp: 0, gp: 15, pp: 0 },
      weight: 3,
      damage: "1d8",
      damageType: "slashing",
      weaponProperties: ["Versatile"],
      versatileDamage: "1d10",
      proficiencyGroup: "Martial"
    },
    "Shortbow": {
      type: "WEAPON",
      category: "Simple Ranged",
      subtype: "Shortbow",
      currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
      weight: 2,
      damage: "1d6",
      damageType: "piercing",
      weaponProperties: ["Ammunition", "Two-Handed"],
      rangeNormal: 80,
      rangeLong: 320,
      ammunitionType: "Arrows",
      proficiencyGroup: "Simple"
    }
  },
  armor: {
    "Chain Shirt": {
      type: "ARMOR",
      category: "Medium",
      subtype: "Chain Shirt",
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 20,
      armorType: "medium",
      baseAC: 13,
      dexCap: 2,
      donTime: "5 minutes",
      doffTime: "1 minute",
      proficiencyGroup: "Medium Armor"
    },
    "Plate": {
      type: "ARMOR",
      category: "Heavy",
      subtype: "Plate",
      currency: { cp: 0, sp: 0, gp: 1500, pp: 0 },
      weight: 65,
      armorType: "heavy",
      baseAC: 18,
      dexCap: 0,
      strengthRequired: 15,
      stealthDisadvantage: true,
      donTime: "10 minutes",
      doffTime: "5 minutes",
      proficiencyGroup: "Heavy Armor"
    }
  },
  potions: {
    "Potion of Healing": {
      type: "CONSUMABLE",
      subtype: "Potion",
      rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 0.5,
      activationTime: "Action",
      effectType: "healing",
      healingAmount: "2d4+2",
      doses: 1
    },
    "Potion of Greater Healing": {
      type: "CONSUMABLE",
      subtype: "Potion",
      rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 200, pp: 0 },
      weight: 0.5,
      activationTime: "Action",
      effectType: "healing",
      healingAmount: "4d4+4",
      doses: 1
    }
  },
  scrolls: {
    "Spell Scroll (1st level)": {
      type: "CONSUMABLE",
      subtype: "Scroll",
      rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 0,
      activationTime: "Action",
      scrollLevel: 1,
      requiresCheck: true,
      checkDC: 11
    },
    "Spell Scroll (3rd level)": {
      type: "CONSUMABLE",
      subtype: "Scroll",
      rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 250, pp: 0 },
      weight: 0,
      activationTime: "Action",
      scrollLevel: 3,
      requiresCheck: true,
      checkDC: 13
    }
  },
  poisons: {
    "Basic Poison": {
      type: "CONSUMABLE",
      subtype: "Poison",
      rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 100, pp: 0 },
      weight: 0,
      poisonType: "Injury",
      activationTime: "Action",
      saveDC: 10,
      saveType: "CON",
      consumableDamage: "1d4",
      consumableDamageType: "poison",
      doses: 1
    },
    "Wyvern Poison": {
      type: "CONSUMABLE",
      subtype: "Poison",
      rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 1200, pp: 0 },
      weight: 0,
      poisonType: "Injury",
      activationTime: "Action",
      saveDC: 15,
      saveType: "CON",
      consumableDamage: "7d6",
      consumableDamageType: "poison",
      onSaveEffect: "Half damage",
      doses: 1
    }
  },
  wondrous: {
    "Bag of Holding": {
      type: "MAGIC",
      category: "Wondrous Item",
      rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 },
      weight: 15,
      description: "This bag has an interior space considerably larger than its outside dimensions, roughly 2 feet in diameter at the mouth and 4 feet deep. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet."
    },
    "Cloak of Protection": {
      type: "MAGIC",
      category: "Wondrous Item",
      rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 },
      weight: 1,
      requiresAttunement: true,
      bonus: 1,
      description: "You gain a +1 bonus to AC and saving throws while you wear this cloak."
    }
  }
};

export const getTemplatesByCategory = (category: string) => {
  switch(category) {
    case "weapon": return ITEM_TEMPLATES.weapons;
    case "armor": return ITEM_TEMPLATES.armor;
    case "potion": return ITEM_TEMPLATES.potions;
    case "scroll": return ITEM_TEMPLATES.scrolls;
    case "poison": return ITEM_TEMPLATES.poisons;
    case "wondrous": return ITEM_TEMPLATES.wondrous;
    default: return {};
  }
};
