/**
 * D&D 5E Class Resource Definitions
 * Maps class features to resource grants
 */

export interface ResourceGrant {
  key: string;
  label: string;
  maxFormula: string;
  recharge: 'short' | 'long' | 'daily' | 'never' | 'manual';
  metadata?: Record<string, any>;
}

/**
 * Class resource definitions by class name and level
 */
export const CLASS_RESOURCE_DEFINITIONS: Record<string, Record<number, ResourceGrant[]>> = {
  Fighter: {
    2: [{
      key: 'action_surge',
      label: 'Action Surge',
      maxFormula: '1',
      recharge: 'short',
      metadata: { source: 'class', class: 'Fighter' }
    }],
    9: [{
      key: 'indomitable',
      label: 'Indomitable',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Fighter' }
    }],
    13: [{
      key: 'indomitable',
      label: 'Indomitable',
      maxFormula: '2',
      recharge: 'long',
      metadata: { source: 'class', class: 'Fighter', upgrade: true }
    }],
    17: [
      {
        key: 'action_surge',
        label: 'Action Surge',
        maxFormula: '2',
        recharge: 'short',
        metadata: { source: 'class', class: 'Fighter', upgrade: true }
      },
      {
        key: 'indomitable',
        label: 'Indomitable',
        maxFormula: '3',
        recharge: 'long',
        metadata: { source: 'class', class: 'Fighter', upgrade: true }
      }
    ]
  },
  Rogue: {
    // Rogues don't have traditional resources, but we could add Cunning Strike points here
  },
  Cleric: {
    2: [{
      key: 'channel_divinity',
      label: 'Channel Divinity',
      maxFormula: '1',
      recharge: 'short',
      metadata: { source: 'class', class: 'Cleric' }
    }],
    6: [{
      key: 'channel_divinity',
      label: 'Channel Divinity',
      maxFormula: '2',
      recharge: 'short',
      metadata: { source: 'class', class: 'Cleric', upgrade: true }
    }],
    18: [{
      key: 'channel_divinity',
      label: 'Channel Divinity',
      maxFormula: '3',
      recharge: 'short',
      metadata: { source: 'class', class: 'Cleric', upgrade: true }
    }]
  },
  Warlock: {
    11: [{
      key: 'mystic_arcanum_6',
      label: 'Mystic Arcanum (6th)',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Warlock', spell_level: 6 }
    }],
    13: [{
      key: 'mystic_arcanum_7',
      label: 'Mystic Arcanum (7th)',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Warlock', spell_level: 7 }
    }],
    15: [{
      key: 'mystic_arcanum_8',
      label: 'Mystic Arcanum (8th)',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Warlock', spell_level: 8 }
    }],
    17: [{
      key: 'mystic_arcanum_9',
      label: 'Mystic Arcanum (9th)',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Warlock', spell_level: 9 }
    }]
  },
  Sorcerer: {
    2: [{
      key: 'sorcery_points',
      label: 'Sorcery Points',
      maxFormula: 'level',
      recharge: 'long',
      metadata: { source: 'class', class: 'Sorcerer' }
    }]
  },
  Barbarian: {
    1: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '2',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian' }
    }],
    3: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '3',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian', upgrade: true }
    }],
    6: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '4',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian', upgrade: true }
    }],
    12: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '5',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian', upgrade: true }
    }],
    17: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '6',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian', upgrade: true }
    }],
    20: [{
      key: 'rage',
      label: 'Rage',
      maxFormula: '999',
      recharge: 'long',
      metadata: { source: 'class', class: 'Barbarian', upgrade: true }
    }]
  },
  Monk: {
    2: [{
      key: 'ki_points',
      label: 'Ki Points',
      maxFormula: 'level',
      recharge: 'short',
      metadata: { source: 'class', class: 'Monk' }
    }]
  },
  Bard: {
    1: [{
      key: 'bardic_inspiration',
      label: 'Bardic Inspiration',
      maxFormula: 'max(1, floor((charisma-10)/2))',
      recharge: 'long',
      metadata: { source: 'class', class: 'Bard' }
    }],
    5: [{
      key: 'bardic_inspiration',
      label: 'Bardic Inspiration',
      maxFormula: 'max(1, floor((charisma-10)/2))',
      recharge: 'short',
      metadata: { source: 'class', class: 'Bard', upgrade: true }
    }]
  },
  Druid: {
    2: [{
      key: 'wild_shape',
      label: 'Wild Shape',
      maxFormula: '2',
      recharge: 'short',
      metadata: { source: 'class', class: 'Druid' }
    }]
  },
  Paladin: {
    3: [{
      key: 'channel_divinity',
      label: 'Channel Divinity',
      maxFormula: '1',
      recharge: 'short',
      metadata: { source: 'class', class: 'Paladin' }
    }]
  },
  Wizard: {
    2: [{
      key: 'arcane_recovery',
      label: 'Arcane Recovery',
      maxFormula: '1',
      recharge: 'long',
      metadata: { source: 'class', class: 'Wizard' }
    }]
  },
  Ranger: {
    // Rangers don't have traditional limited-use resources in base 5e
  }
};

/**
 * Get resource grants for a class at a specific level
 */
export function getResourceGrantsForLevel(className: string, level: number): ResourceGrant[] {
  const classResources = CLASS_RESOURCE_DEFINITIONS[className];
  if (!classResources) return [];
  
  return classResources[level] || [];
}

/**
 * Get all resources for a class up to a given level
 */
export function getAllResourcesForClass(className: string, level: number): ResourceGrant[] {
  const classResources = CLASS_RESOURCE_DEFINITIONS[className];
  if (!classResources) return [];
  
  const resources = new Map<string, ResourceGrant>();
  
  // Accumulate resources up to current level (later levels override earlier ones for upgrades)
  for (let currentLevel = 1; currentLevel <= level; currentLevel++) {
    const levelResources = classResources[currentLevel] || [];
    levelResources.forEach(resource => {
      resources.set(resource.key, resource);
    });
  }
  
  return Array.from(resources.values());
}
