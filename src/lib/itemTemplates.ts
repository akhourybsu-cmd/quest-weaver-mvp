// Pre-built item templates for quick creation — SRD 5E accurate

export const ITEM_TEMPLATES = {
  weapons: {
    // Simple Melee
    "Club": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 1, gp: 0, pp: 0 },
      weight: 2, damage: "1d4", damageType: "bludgeoning", weaponProperties: ["Light"], proficiencyGroup: "Simple"
    },
    "Dagger": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 2, pp: 0 },
      weight: 1, damage: "1d4", damageType: "piercing", weaponProperties: ["Finesse", "Light", "Thrown"],
      rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Simple"
    },
    "Greatclub": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 2, gp: 0, pp: 0 },
      weight: 10, damage: "1d8", damageType: "bludgeoning", weaponProperties: ["Two-Handed"], proficiencyGroup: "Simple"
    },
    "Handaxe": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 5, pp: 0 },
      weight: 2, damage: "1d6", damageType: "slashing", weaponProperties: ["Light", "Thrown"],
      rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Simple"
    },
    "Javelin": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 5, gp: 0, pp: 0 },
      weight: 2, damage: "1d6", damageType: "piercing", weaponProperties: ["Thrown"],
      rangeNormal: 30, rangeLong: 120, proficiencyGroup: "Simple"
    },
    "Light Hammer": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 2, pp: 0 },
      weight: 2, damage: "1d4", damageType: "bludgeoning", weaponProperties: ["Light", "Thrown"],
      rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Simple"
    },
    "Mace": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 5, pp: 0 },
      weight: 4, damage: "1d6", damageType: "bludgeoning", weaponProperties: [], proficiencyGroup: "Simple"
    },
    "Quarterstaff": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 2, gp: 0, pp: 0 },
      weight: 4, damage: "1d6", damageType: "bludgeoning", weaponProperties: ["Versatile"],
      versatileDamage: "1d8", proficiencyGroup: "Simple"
    },
    "Sickle": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 1, pp: 0 },
      weight: 2, damage: "1d4", damageType: "slashing", weaponProperties: ["Light"], proficiencyGroup: "Simple"
    },
    "Spear": {
      type: "WEAPON", category: "Simple Melee", currency: { cp: 0, sp: 0, gp: 1, pp: 0 },
      weight: 3, damage: "1d6", damageType: "piercing", weaponProperties: ["Thrown", "Versatile"],
      versatileDamage: "1d8", rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Simple"
    },
    // Simple Ranged
    "Light Crossbow": {
      type: "WEAPON", category: "Simple Ranged", currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
      weight: 5, damage: "1d8", damageType: "piercing", weaponProperties: ["Ammunition", "Loading", "Two-Handed"],
      rangeNormal: 80, rangeLong: 320, ammunitionType: "Bolts", proficiencyGroup: "Simple"
    },
    "Dart": {
      type: "WEAPON", category: "Simple Ranged", currency: { cp: 5, sp: 0, gp: 0, pp: 0 },
      weight: 0.25, damage: "1d4", damageType: "piercing", weaponProperties: ["Finesse", "Thrown"],
      rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Simple"
    },
    "Shortbow": {
      type: "WEAPON", category: "Simple Ranged", currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
      weight: 2, damage: "1d6", damageType: "piercing", weaponProperties: ["Ammunition", "Two-Handed"],
      rangeNormal: 80, rangeLong: 320, ammunitionType: "Arrows", proficiencyGroup: "Simple"
    },
    "Sling": {
      type: "WEAPON", category: "Simple Ranged", currency: { cp: 0, sp: 1, gp: 0, pp: 0 },
      weight: 0, damage: "1d4", damageType: "bludgeoning", weaponProperties: ["Ammunition"],
      rangeNormal: 30, rangeLong: 120, ammunitionType: "Sling Bullets", proficiencyGroup: "Simple"
    },
    // Martial Melee
    "Battleaxe": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 4, damage: "1d8", damageType: "slashing", weaponProperties: ["Versatile"],
      versatileDamage: "1d10", proficiencyGroup: "Martial"
    },
    "Flail": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 2, damage: "1d8", damageType: "bludgeoning", weaponProperties: [], proficiencyGroup: "Martial"
    },
    "Glaive": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 20, pp: 0 },
      weight: 6, damage: "1d10", damageType: "slashing", weaponProperties: ["Heavy", "Reach", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Greataxe": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 30, pp: 0 },
      weight: 7, damage: "1d12", damageType: "slashing", weaponProperties: ["Heavy", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Greatsword": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 6, damage: "2d6", damageType: "slashing", weaponProperties: ["Heavy", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Halberd": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 20, pp: 0 },
      weight: 6, damage: "1d10", damageType: "slashing", weaponProperties: ["Heavy", "Reach", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Lance": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 6, damage: "1d12", damageType: "piercing", weaponProperties: ["Reach", "Special"], proficiencyGroup: "Martial"
    },
    "Longsword": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 15, pp: 0 },
      weight: 3, damage: "1d8", damageType: "slashing", weaponProperties: ["Versatile"],
      versatileDamage: "1d10", proficiencyGroup: "Martial"
    },
    "Maul": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 10, damage: "2d6", damageType: "bludgeoning", weaponProperties: ["Heavy", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Morningstar": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 15, pp: 0 },
      weight: 4, damage: "1d8", damageType: "piercing", weaponProperties: [], proficiencyGroup: "Martial"
    },
    "Pike": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 5, pp: 0 },
      weight: 18, damage: "1d10", damageType: "piercing", weaponProperties: ["Heavy", "Reach", "Two-Handed"], proficiencyGroup: "Martial"
    },
    "Rapier": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
      weight: 2, damage: "1d8", damageType: "piercing", weaponProperties: ["Finesse"], proficiencyGroup: "Martial"
    },
    "Scimitar": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
      weight: 3, damage: "1d6", damageType: "slashing", weaponProperties: ["Finesse", "Light"], proficiencyGroup: "Martial"
    },
    "Shortsword": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 2, damage: "1d6", damageType: "piercing", weaponProperties: ["Finesse", "Light"], proficiencyGroup: "Martial"
    },
    "Trident": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 5, pp: 0 },
      weight: 4, damage: "1d6", damageType: "piercing", weaponProperties: ["Thrown", "Versatile"],
      versatileDamage: "1d8", rangeNormal: 20, rangeLong: 60, proficiencyGroup: "Martial"
    },
    "War Pick": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 5, pp: 0 },
      weight: 2, damage: "1d8", damageType: "piercing", weaponProperties: [], proficiencyGroup: "Martial"
    },
    "Warhammer": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 15, pp: 0 },
      weight: 2, damage: "1d8", damageType: "bludgeoning", weaponProperties: ["Versatile"],
      versatileDamage: "1d10", proficiencyGroup: "Martial"
    },
    "Whip": {
      type: "WEAPON", category: "Martial Melee", currency: { cp: 0, sp: 0, gp: 2, pp: 0 },
      weight: 3, damage: "1d4", damageType: "slashing", weaponProperties: ["Finesse", "Reach"], proficiencyGroup: "Martial"
    },
    // Martial Ranged
    "Blowgun": {
      type: "WEAPON", category: "Martial Ranged", currency: { cp: 0, sp: 0, gp: 10, pp: 0 },
      weight: 1, damage: "1", damageType: "piercing", weaponProperties: ["Ammunition", "Loading"],
      rangeNormal: 25, rangeLong: 100, ammunitionType: "Blowgun Needles", proficiencyGroup: "Martial"
    },
    "Hand Crossbow": {
      type: "WEAPON", category: "Martial Ranged", currency: { cp: 0, sp: 0, gp: 75, pp: 0 },
      weight: 3, damage: "1d6", damageType: "piercing", weaponProperties: ["Ammunition", "Light", "Loading"],
      rangeNormal: 30, rangeLong: 120, ammunitionType: "Bolts", proficiencyGroup: "Martial"
    },
    "Heavy Crossbow": {
      type: "WEAPON", category: "Martial Ranged", currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 18, damage: "1d10", damageType: "piercing", weaponProperties: ["Ammunition", "Heavy", "Loading", "Two-Handed"],
      rangeNormal: 100, rangeLong: 400, ammunitionType: "Bolts", proficiencyGroup: "Martial"
    },
    "Longbow": {
      type: "WEAPON", category: "Martial Ranged", currency: { cp: 0, sp: 0, gp: 50, pp: 0 },
      weight: 2, damage: "1d8", damageType: "piercing", weaponProperties: ["Ammunition", "Heavy", "Two-Handed"],
      rangeNormal: 150, rangeLong: 600, ammunitionType: "Arrows", proficiencyGroup: "Martial"
    },
    "Net": {
      type: "WEAPON", category: "Martial Ranged", currency: { cp: 0, sp: 0, gp: 1, pp: 0 },
      weight: 3, damage: "0", damageType: "bludgeoning", weaponProperties: ["Special", "Thrown"],
      rangeNormal: 5, rangeLong: 15, proficiencyGroup: "Martial"
    },
  },
  armor: {
    // Light
    "Padded": {
      type: "ARMOR", category: "Light", armorType: "light", baseAC: 11, dexCap: null,
      currency: { cp: 0, sp: 0, gp: 5, pp: 0 }, weight: 8,
      stealthDisadvantage: true, donTime: "1 minute", doffTime: "1 minute", proficiencyGroup: "Light Armor"
    },
    "Leather": {
      type: "ARMOR", category: "Light", armorType: "light", baseAC: 11, dexCap: null,
      currency: { cp: 0, sp: 0, gp: 10, pp: 0 }, weight: 10,
      donTime: "1 minute", doffTime: "1 minute", proficiencyGroup: "Light Armor"
    },
    "Studded Leather": {
      type: "ARMOR", category: "Light", armorType: "light", baseAC: 12, dexCap: null,
      currency: { cp: 0, sp: 0, gp: 45, pp: 0 }, weight: 13,
      donTime: "1 minute", doffTime: "1 minute", proficiencyGroup: "Light Armor"
    },
    // Medium
    "Hide": {
      type: "ARMOR", category: "Medium", armorType: "medium", baseAC: 12, dexCap: 2,
      currency: { cp: 0, sp: 0, gp: 10, pp: 0 }, weight: 12,
      donTime: "5 minutes", doffTime: "1 minute", proficiencyGroup: "Medium Armor"
    },
    "Chain Shirt": {
      type: "ARMOR", category: "Medium", armorType: "medium", baseAC: 13, dexCap: 2,
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 }, weight: 20,
      donTime: "5 minutes", doffTime: "1 minute", proficiencyGroup: "Medium Armor"
    },
    "Scale Mail": {
      type: "ARMOR", category: "Medium", armorType: "medium", baseAC: 14, dexCap: 2,
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 }, weight: 45,
      stealthDisadvantage: true, donTime: "5 minutes", doffTime: "1 minute", proficiencyGroup: "Medium Armor"
    },
    "Breastplate": {
      type: "ARMOR", category: "Medium", armorType: "medium", baseAC: 14, dexCap: 2,
      currency: { cp: 0, sp: 0, gp: 400, pp: 0 }, weight: 20,
      donTime: "5 minutes", doffTime: "1 minute", proficiencyGroup: "Medium Armor"
    },
    "Half Plate": {
      type: "ARMOR", category: "Medium", armorType: "medium", baseAC: 15, dexCap: 2,
      currency: { cp: 0, sp: 0, gp: 750, pp: 0 }, weight: 40,
      stealthDisadvantage: true, donTime: "5 minutes", doffTime: "1 minute", proficiencyGroup: "Medium Armor"
    },
    // Heavy
    "Ring Mail": {
      type: "ARMOR", category: "Heavy", armorType: "heavy", baseAC: 14, dexCap: 0,
      currency: { cp: 0, sp: 0, gp: 30, pp: 0 }, weight: 40,
      stealthDisadvantage: true, donTime: "10 minutes", doffTime: "5 minutes", proficiencyGroup: "Heavy Armor"
    },
    "Chain Mail": {
      type: "ARMOR", category: "Heavy", armorType: "heavy", baseAC: 16, dexCap: 0,
      currency: { cp: 0, sp: 0, gp: 75, pp: 0 }, weight: 55,
      strengthRequired: 13, stealthDisadvantage: true, donTime: "10 minutes", doffTime: "5 minutes", proficiencyGroup: "Heavy Armor"
    },
    "Splint": {
      type: "ARMOR", category: "Heavy", armorType: "heavy", baseAC: 17, dexCap: 0,
      currency: { cp: 0, sp: 0, gp: 200, pp: 0 }, weight: 60,
      strengthRequired: 15, stealthDisadvantage: true, donTime: "10 minutes", doffTime: "5 minutes", proficiencyGroup: "Heavy Armor"
    },
    "Plate": {
      type: "ARMOR", category: "Heavy", armorType: "heavy", baseAC: 18, dexCap: 0,
      currency: { cp: 0, sp: 0, gp: 1500, pp: 0 }, weight: 65,
      strengthRequired: 15, stealthDisadvantage: true, donTime: "10 minutes", doffTime: "5 minutes", proficiencyGroup: "Heavy Armor"
    },
    // Shield
    "Shield": {
      type: "ARMOR", category: "Shield", armorType: "shield", baseAC: 2, dexCap: null,
      currency: { cp: 0, sp: 0, gp: 10, pp: 0 }, weight: 6,
      donTime: "1 action", doffTime: "1 action", proficiencyGroup: "Shields"
    },
  },
  potions: {
    "Potion of Healing": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "healing", healingAmount: "2d4+2", doses: 1
    },
    "Potion of Greater Healing": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 200, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "healing", healingAmount: "4d4+4", doses: 1
    },
    "Potion of Superior Healing": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "healing", healingAmount: "8d4+8", doses: 1
    },
    "Potion of Supreme Healing": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Very Rare",
      currency: { cp: 0, sp: 0, gp: 1500, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "healing", healingAmount: "10d4+20", doses: 1
    },
    "Potion of Fire Resistance": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 300, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "resistance", healingAmount: "", doses: 1
    },
    "Potion of Invisibility": {
      type: "CONSUMABLE", subtype: "Potion", rarity: "Very Rare",
      currency: { cp: 0, sp: 0, gp: 5000, pp: 0 }, weight: 0.5,
      activationTime: "Action", effectType: "buff", healingAmount: "", doses: 1
    },
  },
  scrolls: {
    "Spell Scroll (Cantrip)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 25, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 0, requiresCheck: false, checkDC: 0
    },
    "Spell Scroll (1st level)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 50, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 1, requiresCheck: true, checkDC: 11
    },
    "Spell Scroll (2nd level)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 150, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 2, requiresCheck: true, checkDC: 12
    },
    "Spell Scroll (3rd level)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 250, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 3, requiresCheck: true, checkDC: 13
    },
    "Spell Scroll (4th level)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 4, requiresCheck: true, checkDC: 14
    },
    "Spell Scroll (5th level)": {
      type: "CONSUMABLE", subtype: "Scroll", rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 1000, pp: 0 }, weight: 0,
      activationTime: "Action", scrollLevel: 5, requiresCheck: true, checkDC: 15
    },
  },
  poisons: {
    "Basic Poison": {
      type: "CONSUMABLE", subtype: "Poison", rarity: "Common",
      currency: { cp: 0, sp: 0, gp: 100, pp: 0 }, weight: 0,
      poisonType: "Injury", activationTime: "Action",
      saveDC: 10, saveType: "CON", consumableDamage: "1d4", consumableDamageType: "poison", doses: 1
    },
    "Assassin's Blood": {
      type: "CONSUMABLE", subtype: "Poison", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 150, pp: 0 }, weight: 0,
      poisonType: "Ingested", activationTime: "Action",
      saveDC: 10, saveType: "CON", consumableDamage: "1d12", consumableDamageType: "poison", doses: 1
    },
    "Serpent Venom": {
      type: "CONSUMABLE", subtype: "Poison", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 200, pp: 0 }, weight: 0,
      poisonType: "Injury", activationTime: "Action",
      saveDC: 11, saveType: "CON", consumableDamage: "3d6", consumableDamageType: "poison", doses: 1
    },
    "Wyvern Poison": {
      type: "CONSUMABLE", subtype: "Poison", rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 1200, pp: 0 }, weight: 0,
      poisonType: "Injury", activationTime: "Action",
      saveDC: 15, saveType: "CON", consumableDamage: "7d6", consumableDamageType: "poison",
      onSaveEffect: "Half damage", doses: 1
    },
    "Purple Worm Poison": {
      type: "CONSUMABLE", subtype: "Poison", rarity: "Very Rare",
      currency: { cp: 0, sp: 0, gp: 2000, pp: 0 }, weight: 0,
      poisonType: "Injury", activationTime: "Action",
      saveDC: 19, saveType: "CON", consumableDamage: "12d6", consumableDamageType: "poison", doses: 1
    },
  },
  wondrous: {
    "Bag of Holding": {
      type: "MAGIC", category: "Wondrous Item", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 15,
      description: "This bag has an interior space considerably larger than its outside dimensions, roughly 2 feet in diameter at the mouth and 4 feet deep. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet."
    },
    "Cloak of Protection": {
      type: "MAGIC", category: "Wondrous Item", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 1,
      requiresAttunement: true, bonus: 1,
      description: "You gain a +1 bonus to AC and saving throws while you wear this cloak."
    },
    "Boots of Elvenkind": {
      type: "MAGIC", category: "Wondrous Item", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 1,
      description: "While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have advantage on Dexterity (Stealth) checks that rely on moving silently."
    },
    "Gauntlets of Ogre Power": {
      type: "MAGIC", category: "Wondrous Item", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 1000, pp: 0 }, weight: 1,
      requiresAttunement: true,
      description: "Your Strength score is 19 while you wear these gauntlets. They have no effect on you if your Strength is already 19 or higher."
    },
    "Ring of Protection": {
      type: "MAGIC", category: "Ring", rarity: "Rare",
      currency: { cp: 0, sp: 0, gp: 3500, pp: 0 }, weight: 0,
      requiresAttunement: true, bonus: 1,
      description: "You gain a +1 bonus to AC and saving throws while wearing this ring."
    },
    "Wand of Magic Missiles": {
      type: "MAGIC", category: "Wand", rarity: "Uncommon",
      currency: { cp: 0, sp: 0, gp: 500, pp: 0 }, weight: 1,
      description: "This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the magic missile spell from it. For 1 charge, you cast the 1st-level version of the spell. You can increase the spell slot level by one for each additional charge you expend. The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll a d20. On a 1, the wand crumbles into ashes and is destroyed."
    },
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
