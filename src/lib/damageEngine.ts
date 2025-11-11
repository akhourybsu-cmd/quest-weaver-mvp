/**
 * D&D 5E Damage Engine
 * Implements proper damage resolution per 5E rules with correct ordering
 */

export type DamageType = 
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' 
  | 'lightning' | 'necrotic' | 'piercing' | 'poison' 
  | 'psychic' | 'radiant' | 'slashing' | 'thunder';

export interface DamageResult {
  finalDamage: number;
  hpLost: number;
  tempHpLost: number;
  newCurrentHp: number;
  newTempHp: number;
  wasImmune: boolean;
  wasResisted: boolean;
  wasVulnerable: boolean;
  concentrationDC: number | null;
  steps: string[];
}

export interface Character {
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
}

/**
 * Apply damage following D&D 5E rules:
 * 1. Check immunity (damage = 0 if immune)
 * 2. Apply resistance XOR vulnerability (they cancel if both present)
 * 3. Apply to temp HP first
 * 4. Apply remainder to current HP
 * 5. Calculate concentration DC if applicable
 */
export function applyDamage(
  character: Character,
  baseDamage: number,
  damageType: DamageType,
  isConcentrating: boolean = false,
  isCriticalHit: boolean = false
): DamageResult {
  const steps: string[] = [];
  let damage = baseDamage;
  
  // Note: Critical hits double DICE, not the final damage
  // This is handled in the attack roll phase, not here
  if (isCriticalHit) {
    steps.push(`CRITICAL HIT! (dice were doubled in attack roll)`);
  }
  
  steps.push(`Base damage: ${baseDamage} ${damageType}`);

  // Step 1: Check immunity
  const isImmune = character.immunities?.includes(damageType) || false;
  if (isImmune) {
    steps.push(`Immune to ${damageType} - damage reduced to 0`);
    return {
      finalDamage: 0,
      hpLost: 0,
      tempHpLost: 0,
      newCurrentHp: character.current_hp,
      newTempHp: character.temp_hp,
      wasImmune: true,
      wasResisted: false,
      wasVulnerable: false,
      concentrationDC: null,
      steps,
    };
  }

  // Step 2: Apply resistance XOR vulnerability
  const hasResistance = character.resistances?.includes(damageType) || false;
  const hasVulnerability = character.vulnerabilities?.includes(damageType) || false;

  if (hasResistance && hasVulnerability) {
    steps.push(`Both resistance and vulnerability - they cancel (normal damage)`);
  } else if (hasResistance) {
    damage = Math.floor(damage / 2);
    steps.push(`Resistant to ${damageType} - damage halved to ${damage}`);
  } else if (hasVulnerability) {
    damage = damage * 2;
    steps.push(`Vulnerable to ${damageType} - damage doubled to ${damage}`);
  }

  // Step 3: Apply to temporary HP
  const tempHp = character.temp_hp || 0;
  const tempHpLost = Math.min(damage, tempHp);
  const newTempHp = Math.max(0, tempHp - damage);
  const remainingDamage = Math.max(0, damage - tempHp);

  if (tempHpLost > 0) {
    steps.push(`${tempHpLost} damage absorbed by temporary HP (${tempHp} → ${newTempHp})`);
  }

  // Step 4: Apply to current HP
  const hpLost = Math.min(remainingDamage, character.current_hp);
  const newCurrentHp = Math.max(0, character.current_hp - remainingDamage);

  if (hpLost > 0) {
    steps.push(`${hpLost} damage to HP (${character.current_hp} → ${newCurrentHp})`);
  }

  // Step 5: Calculate concentration DC
  let concentrationDC: number | null = null;
  if (isConcentrating && damage > 0) {
    // DC = max(10, floor(total damage / 2))
    concentrationDC = Math.max(10, Math.floor(damage / 2));
    steps.push(`Concentration check required: DC ${concentrationDC}`);
  }

  return {
    finalDamage: damage,
    hpLost,
    tempHpLost,
    newCurrentHp,
    newTempHp,
    wasImmune: false,
    wasResisted: hasResistance && !hasVulnerability,
    wasVulnerable: hasVulnerability && !hasResistance,
    concentrationDC,
    steps,
  };
}

/**
 * Calculate the initiative bonus (Dex modifier + any misc bonuses)
 */
export function calculateInitiativeBonus(dexScore: number, miscBonus: number = 0): number {
  const dexMod = Math.floor((dexScore - 10) / 2);
  return dexMod + miscBonus;
}
