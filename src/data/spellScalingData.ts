/**
 * Spell scaling data for common D&D 5E spells
 * This data can be used to seed the database or provide defaults
 */

export interface SpellScalingData {
  spellName: string;
  scalingType: 'per_slot' | 'per_two_slots' | 'fixed_increase' | 'none';
  scalingValue: string;
  scalingDescription: string;
}

export const SPELL_SCALING_DATA: SpellScalingData[] = [
  // Level 1 Spells
  {
    spellName: 'Cure Wounds',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Heals an additional 1d8 HP for each slot level above 1st',
  },
  {
    spellName: 'Guiding Bolt',
    scalingType: 'per_slot',
    scalingValue: '+1d6',
    scalingDescription: 'Deals an additional 1d6 radiant damage for each slot level above 1st',
  },
  {
    spellName: 'Healing Word',
    scalingType: 'per_slot',
    scalingValue: '+1d4',
    scalingDescription: 'Heals an additional 1d4 HP for each slot level above 1st',
  },
  {
    spellName: 'Inflict Wounds',
    scalingType: 'per_slot',
    scalingValue: '+1d10',
    scalingDescription: 'Deals an additional 1d10 necrotic damage for each slot level above 1st',
  },
  {
    spellName: 'Magic Missile',
    scalingType: 'per_slot',
    scalingValue: '+1 dart',
    scalingDescription: 'Creates one additional dart for each slot level above 1st',
  },
  {
    spellName: 'Thunderwave',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 thunder damage for each slot level above 1st',
  },
  
  // Level 2 Spells
  {
    spellName: 'Aid',
    scalingType: 'per_slot',
    scalingValue: '+5 HP',
    scalingDescription: 'Increases HP by an additional 5 for each slot level above 2nd',
  },
  {
    spellName: 'Prayer of Healing',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Heals an additional 1d8 HP for each slot level above 2nd',
  },
  {
    spellName: 'Scorching Ray',
    scalingType: 'per_slot',
    scalingValue: '+1 ray',
    scalingDescription: 'Creates one additional ray for each slot level above 2nd',
  },
  {
    spellName: 'Shatter',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 thunder damage for each slot level above 2nd',
  },
  {
    spellName: 'Spiritual Weapon',
    scalingType: 'per_two_slots',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 damage for every two slot levels above 2nd',
  },
  
  // Level 3 Spells
  {
    spellName: 'Fireball',
    scalingType: 'per_slot',
    scalingValue: '+1d6',
    scalingDescription: 'Deals an additional 1d6 fire damage for each slot level above 3rd',
  },
  {
    spellName: 'Lightning Bolt',
    scalingType: 'per_slot',
    scalingValue: '+1d6',
    scalingDescription: 'Deals an additional 1d6 lightning damage for each slot level above 3rd',
  },
  {
    spellName: 'Mass Healing Word',
    scalingType: 'per_slot',
    scalingValue: '+1d4',
    scalingDescription: 'Heals an additional 1d4 HP for each slot level above 3rd',
  },
  {
    spellName: 'Spirit Guardians',
    scalingType: 'per_two_slots',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 damage for every two slot levels above 3rd',
  },
  
  // Level 4 Spells
  {
    spellName: 'Blight',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 necrotic damage for each slot level above 4th',
  },
  {
    spellName: 'Ice Storm',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Bludgeoning damage increases by 1d8 for each slot level above 4th',
  },
  
  // Level 5 Spells
  {
    spellName: 'Cone of Cold',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 cold damage for each slot level above 5th',
  },
  {
    spellName: 'Flame Strike',
    scalingType: 'per_slot',
    scalingValue: '+1d6',
    scalingDescription: 'Deals an additional 1d6 fire damage for each slot level above 5th',
  },
  {
    spellName: 'Mass Cure Wounds',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Heals an additional 1d8 HP for each slot level above 5th',
  },
  
  // Level 6 Spells
  {
    spellName: 'Chain Lightning',
    scalingType: 'per_slot',
    scalingValue: '+1 target',
    scalingDescription: 'Targets one additional creature for each slot level above 6th',
  },
  {
    spellName: 'Disintegrate',
    scalingType: 'per_slot',
    scalingValue: '+3d6',
    scalingDescription: 'Deals an additional 3d6 force damage for each slot level above 6th',
  },
  {
    spellName: 'Harm',
    scalingType: 'per_slot',
    scalingValue: '+1d8',
    scalingDescription: 'Deals an additional 1d8 necrotic damage for each slot level above 6th',
  },
  {
    spellName: 'Heal',
    scalingType: 'per_slot',
    scalingValue: '+10 HP',
    scalingDescription: 'Heals an additional 10 HP for each slot level above 6th',
  },
  
  // Spells with no scaling
  {
    spellName: 'Shield',
    scalingType: 'none',
    scalingValue: '',
    scalingDescription: 'This spell does not benefit from being cast at higher levels',
  },
  {
    spellName: 'Counterspell',
    scalingType: 'none',
    scalingValue: '',
    scalingDescription: 'Automatically counters spells of 3rd level or lower; higher levels require a check',
  },
  {
    spellName: 'Dispel Magic',
    scalingType: 'none',
    scalingValue: '',
    scalingDescription: 'Automatically dispels spells of 3rd level or lower; higher levels require a check',
  },
];

/**
 * Get scaling data for a spell by name
 */
export function getSpellScaling(spellName: string): SpellScalingData | null {
  return SPELL_SCALING_DATA.find(
    data => data.spellName.toLowerCase() === spellName.toLowerCase()
  ) || null;
}
