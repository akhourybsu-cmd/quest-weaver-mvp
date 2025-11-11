// RAW validation for homebrew items

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export const validateItem = (itemData: any): ValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Basic validation
  if (!itemData.name || itemData.name.trim() === "") {
    errors.push("Item name is required");
  }

  // Weapon validation
  if (itemData.type === "WEAPON" || itemData.weaponCategory) {
    if (!itemData.damage) {
      warnings.push("Weapon damage is not set");
    }
    if (!itemData.damageType) {
      warnings.push("Weapon damage type is not set");
    }
    if (!itemData.weaponCategory) {
      warnings.push("Weapon category (Simple/Martial) is not set");
    }
    if (itemData.weaponProperties?.includes("Ammunition") && !itemData.ammunitionType) {
      warnings.push("Weapon has Ammunition property but no ammunition type specified");
    }
    if (itemData.weaponProperties?.includes("Thrown") && (!itemData.rangeNormal || !itemData.rangeLong)) {
      warnings.push("Thrown weapon should have normal and long range");
    }
    if (itemData.weaponProperties?.includes("Versatile") && !itemData.versatileDamage) {
      warnings.push("Versatile weapon should have versatile damage specified");
    }
  }

  // Armor validation
  if (itemData.type === "ARMOR" || itemData.armorType) {
    if (!itemData.baseAC && itemData.baseAC !== 0) {
      warnings.push("Armor base AC is not set");
    }
    if (!itemData.armorType) {
      warnings.push("Armor type (Light/Medium/Heavy/Shield) is not set");
    }
    if (itemData.armorType === "heavy" && itemData.dexCap === undefined) {
      warnings.push("Heavy armor should have dexCap set to 0");
    }
    if (itemData.armorType === "medium" && itemData.dexCap !== 2) {
      warnings.push("Medium armor typically has dexCap of 2");
    }
    if (!itemData.donTime || !itemData.doffTime) {
      warnings.push("Armor don/doff times are not set");
    }
  }

  // Magic item validation
  if (itemData.type === "MAGIC") {
    if (!itemData.rarity) {
      warnings.push("Magic item rarity is not set");
    }
    if (itemData.requiresAttunement && !itemData.attunementPrereqs && !itemData.attunementText) {
      warnings.push("Attunement required but no prerequisites specified");
    }
    if (itemData.charges?.max && !itemData.rechargeExpression) {
      warnings.push("Item has charges but no recharge expression");
    }
    if (itemData.spellsGranted?.length && !itemData.spellDC && !itemData.spellAttackBonus) {
      warnings.push("Item grants spells but no DC or attack bonus specified");
    }
  }

  // Consumable validation
  if (itemData.type === "CONSUMABLE") {
    if (!itemData.subtype) {
      warnings.push("Consumable subtype is not set");
    }
    if (!itemData.activationTime) {
      warnings.push("Consumable activation time is not set");
    }
    
    if (itemData.subtype === "Scroll") {
      if (!itemData.scrollSpell) {
        errors.push("Scroll must specify a spell");
      }
      if (!itemData.scrollLevel) {
        warnings.push("Scroll spell level is not set");
      }
    }
    
    if (itemData.subtype === "Poison") {
      if (!itemData.poisonType) {
        warnings.push("Poison type (Injury/Ingested/Inhaled/Contact) is not set");
      }
      if (!itemData.saveDC || !itemData.saveType) {
        warnings.push("Poison should have save DC and save type");
      }
    }
  }

  // Currency validation
  if (itemData.currency) {
    const total = (itemData.currency.cp || 0) + 
                  (itemData.currency.sp || 0) * 10 +
                  (itemData.currency.gp || 0) * 100 +
                  (itemData.currency.pp || 0) * 1000;
    if (total === 0 && itemData.rarity && itemData.rarity !== "Common") {
      warnings.push("Non-common item has zero value");
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
};
