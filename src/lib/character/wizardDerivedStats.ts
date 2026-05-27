/**
 * Derived-stat helpers used by CharacterWizard during finalize.
 *
 * Extracted here so they can be unit-tested independently of the wizard
 * component. CharacterWizard.tsx imports from this module.
 */

import { detectArmorInItems, calculateAC } from "@/lib/characterRules";

// ─── Ability bonus application ───────────────────────────────────────────────

/**
 * Merges ancestry/subancestry ability-score bonuses into the base scores.
 * Keys in `abilityBonuses` are normalised to upper-case before lookup so
 * both "str" and "STR" forms work.
 */
export function applyAncestryBonuses(
  baseScores: Record<string, number>,
  abilityBonuses: Record<string, number>
): Record<string, number> {
  const result = { ...baseScores };
  for (const [ability, bonus] of Object.entries(abilityBonuses)) {
    const key = ability.toUpperCase();
    if (key in result) {
      result[key] += bonus;
    }
  }
  return result;
}

// ─── Derived stats ────────────────────────────────────────────────────────────

export interface DerivedStats {
  maxHp: number;
  profBonus: number;
  ac: number;
  initiativeBonus: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  saves: {
    str: number; dex: number; con: number;
    int: number; wis: number; cha: number;
  };
  hitDie: string;
  spellAbility: string | null;
  spellSaveDC: number | null;
  spellAttackMod: number | null;
}

/**
 * Computes all derived character statistics from the wizard draft state.
 *
 * @param draft         The wizard draft (abilityScores, grants, level, className, choices)
 * @param classRules    The SRD class rules object (hitDie, spellcasting, …)
 * @param bundleItems   Equipment items from the selected starting-equipment bundle
 */
export function computeDerivedStats(
  draft: any,
  classRules: any,
  bundleItems?: Array<{ name: string }>
): DerivedStats {
  // Apply ancestry ability bonuses before computing modifiers
  const bonuses = draft.grants?.abilityBonuses || {};
  const scores = applyAncestryBonuses(draft.abilityScores, bonuses);

  const abilityMod = (score: number) => Math.floor((score - 10) / 2);
  const conMod = abilityMod(scores.CON);
  const dexMod = abilityMod(scores.DEX);
  const wisMod = abilityMod(scores.WIS);
  const intMod = abilityMod(scores.INT);
  const chaMod = abilityMod(scores.CHA);
  const strMod = abilityMod(scores.STR);

  const hitDie = classRules?.hitDie || 8;
  const profBonus = Math.floor((draft.level - 1) / 4) + 2;

  // HP: Level 1 = max hit die + CON mod. Levels 2+ use stored hpRoll or average.
  let maxHp = hitDie + conMod;
  const levelChoices = draft.choices?.featureChoices?.levelChoices;
  if (levelChoices && typeof levelChoices === "object") {
    for (let lvl = 2; lvl <= draft.level; lvl++) {
      const lc = levelChoices[lvl];
      const hpRoll = lc?.hpRoll ?? (Math.floor(hitDie / 2) + 1); // default: average
      maxHp += hpRoll + conMod;
    }
  } else if (draft.level > 1) {
    // No level choices recorded — use average for every level above 1
    for (let lvl = 2; lvl <= draft.level; lvl++) {
      maxHp += (Math.floor(hitDie / 2) + 1) + conMod;
    }
  }
  maxHp = Math.max(maxHp, 1); // 5e minimum: 1 HP

  // Passive senses (include proficiency bonus when the skill is known)
  const allSkills = new Set([
    ...Array.from(draft.grants?.skillProficiencies || []),
    ...(draft.choices?.skills || []),
  ]);
  const passivePerception   = 10 + wisMod + (allSkills.has("Perception")   ? profBonus : 0);
  const passiveInvestigation = 10 + intMod + (allSkills.has("Investigation") ? profBonus : 0);
  const passiveInsight      = 10 + wisMod + (allSkills.has("Insight")      ? profBonus : 0);

  // Saving throws
  const saveProficient = draft.grants?.savingThrows || new Set();
  const saves = {
    str: strMod + (saveProficient.has("STR") ? profBonus : 0),
    dex: dexMod + (saveProficient.has("DEX") ? profBonus : 0),
    con: conMod + (saveProficient.has("CON") ? profBonus : 0),
    int: intMod + (saveProficient.has("INT") ? profBonus : 0),
    wis: wisMod + (saveProficient.has("WIS") ? profBonus : 0),
    cha: chaMod + (saveProficient.has("CHA") ? profBonus : 0),
  };

  // Spellcasting stats
  let spellAbility: string | null = null;
  let spellSaveDC: number | null = null;
  let spellAttackMod: number | null = null;

  if (classRules?.spellcasting?.ability) {
    const abilityMap: Record<string, number> = { wis: wisMod, cha: chaMod, int: intMod };
    const castingMod = abilityMap[classRules.spellcasting.ability] || 0;
    spellAbility = classRules.spellcasting.ability.toUpperCase();
    spellSaveDC = 8 + profBonus + castingMod;
    spellAttackMod = profBonus + castingMod;
  }

  // Armor-aware AC
  const { armor: startingArmor, shield: hasShield } = detectArmorInItems(bundleItems ?? []);
  const className = (draft.className || "").toLowerCase();
  let ac: number;

  if (startingArmor) {
    // Equipped armor always overrides class unarmored defense
    ac = calculateAC(scores.DEX, startingArmor, hasShield);
  } else {
    if (className === "barbarian") {
      ac = 10 + dexMod + conMod + (hasShield ? 2 : 0);
    } else if (className === "monk") {
      // Monks lose their WIS bonus if they use a shield
      ac = hasShield ? 10 + dexMod + 2 : 10 + dexMod + wisMod;
    } else {
      ac = 10 + dexMod + (hasShield ? 2 : 0);
    }
  }

  return {
    maxHp,
    profBonus,
    ac,
    initiativeBonus: dexMod,
    passivePerception,
    passiveInvestigation,
    passiveInsight,
    saves,
    hitDie: `d${hitDie}`,
    spellAbility,
    spellSaveDC,
    spellAttackMod,
  };
}
