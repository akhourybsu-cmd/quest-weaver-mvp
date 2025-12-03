// Comprehensive D&D 5E Level-Up Rules Data
// Based on SRD 5.1 rules

export interface FeatureChoice {
  type: 'fighting_style' | 'expertise' | 'metamagic' | 'invocation' | 'pact_boon' | 'maneuver' | 'infusion' | 'totem' | 'land_circle' | 'arcane_tradition' | 'divine_domain' | 'martial_archetype' | 'monastic_tradition' | 'sacred_oath' | 'ranger_archetype' | 'roguish_archetype' | 'sorcerous_origin' | 'otherworldly_patron' | 'magical_secrets' | 'favored_enemy' | 'favored_terrain';
  count: number;
  options?: string[];
  replaceCount?: number; // Can replace this many existing choices
}

export interface SpellcastingRules {
  type: 'none' | 'known' | 'prepared' | 'spellbook' | 'pact';
  ability: 'int' | 'wis' | 'cha' | null;
  canSwapOnLevelUp: boolean;
  spellsPerLevelUp: number; // For Wizard spellbook, this is 2
  learnFromScrolls?: boolean; // Wizard can copy spells
}

export interface ResourceProgression {
  key: string;
  label: string;
  formula: (level: number, abilityMod?: number) => number;
  recharge: 'short' | 'long';
  startLevel?: number;
}

export interface ClassLevelUpRules {
  className: string;
  hitDie: number;
  spellcasting: SpellcastingRules;
  asiLevels: number[];
  cantripProgression: Record<number, number>; // level -> total cantrips at that level
  resourceProgression: ResourceProgression[];
  featureChoiceLevels: Record<number, FeatureChoice[]>;
  subclassLevel: number;
  extraAttackLevel?: number;
}

// Fighting Style options by class
export const FIGHTING_STYLES: Record<string, string[]> = {
  Fighter: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting'],
  Paladin: ['Defense', 'Dueling', 'Great Weapon Fighting', 'Protection'],
  Ranger: ['Archery', 'Defense', 'Dueling', 'Two-Weapon Fighting'],
};

// Metamagic options
export const METAMAGIC_OPTIONS = [
  { id: 'careful', name: 'Careful Spell', description: 'Spend 1 sorcery point to let chosen creatures automatically succeed on saving throws.' },
  { id: 'distant', name: 'Distant Spell', description: 'Spend 1 sorcery point to double the range of a spell.' },
  { id: 'empowered', name: 'Empowered Spell', description: 'Spend 1 sorcery point to reroll damage dice.' },
  { id: 'extended', name: 'Extended Spell', description: 'Spend 1 sorcery point to double the duration of a spell.' },
  { id: 'heightened', name: 'Heightened Spell', description: 'Spend 3 sorcery points to give disadvantage on a saving throw.' },
  { id: 'quickened', name: 'Quickened Spell', description: 'Spend 2 sorcery points to cast a spell as a bonus action.' },
  { id: 'subtle', name: 'Subtle Spell', description: 'Spend 1 sorcery point to cast without verbal or somatic components.' },
  { id: 'twinned', name: 'Twinned Spell', description: 'Spend sorcery points equal to spell level to target a second creature.' },
];

// Eldritch Invocations (SRD)
export const ELDRITCH_INVOCATIONS = [
  { id: 'agonizing_blast', name: 'Agonizing Blast', description: 'Add CHA modifier to eldritch blast damage.', prerequisite: { cantripRequired: 'Eldritch Blast' } },
  { id: 'armor_shadows', name: 'Armor of Shadows', description: 'Cast mage armor on yourself at will.' },
  { id: 'ascendant_step', name: 'Ascendant Step', description: 'Cast levitate on yourself at will.', prerequisite: { level: 9 } },
  { id: 'beast_speech', name: 'Beast Speech', description: 'Cast speak with animals at will.' },
  { id: 'beguiling_influence', name: 'Beguiling Influence', description: 'Gain proficiency in Deception and Persuasion.' },
  { id: 'bewitching_whispers', name: 'Bewitching Whispers', description: 'Cast compulsion once per long rest.', prerequisite: { level: 7 } },
  { id: 'book_ancient_secrets', name: 'Book of Ancient Secrets', description: 'Inscribe rituals into your Book of Shadows.', prerequisite: { pactBoon: 'Pact of the Tome' } },
  { id: 'chains_of_carceri', name: 'Chains of Carceri', description: 'Cast hold monster at will on celestials, fiends, or elementals.', prerequisite: { level: 15, pactBoon: 'Pact of the Chain' } },
  { id: 'devils_sight', name: "Devil's Sight", description: 'See normally in magical and nonmagical darkness up to 120 feet.' },
  { id: 'dreadful_word', name: 'Dreadful Word', description: 'Cast confusion once per long rest.', prerequisite: { level: 7 } },
  { id: 'eldritch_sight', name: 'Eldritch Sight', description: 'Cast detect magic at will.' },
  { id: 'eldritch_spear', name: 'Eldritch Spear', description: 'Eldritch blast range becomes 300 feet.', prerequisite: { cantripRequired: 'Eldritch Blast' } },
  { id: 'eyes_rune_keeper', name: 'Eyes of the Rune Keeper', description: 'Read all writing.' },
  { id: 'fiendish_vigor', name: 'Fiendish Vigor', description: 'Cast false life on yourself at will as a 1st-level spell.' },
  { id: 'gaze_two_minds', name: 'Gaze of Two Minds', description: 'Use action to perceive through a willing humanoid.' },
  { id: 'lifedrinker', name: 'Lifedrinker', description: 'Add CHA modifier to pact weapon damage.', prerequisite: { level: 12, pactBoon: 'Pact of the Blade' } },
  { id: 'mask_many_faces', name: 'Mask of Many Faces', description: 'Cast disguise self at will.' },
  { id: 'master_myriad_forms', name: 'Master of Myriad Forms', description: 'Cast alter self at will.', prerequisite: { level: 15 } },
  { id: 'minions_chaos', name: 'Minions of Chaos', description: 'Cast conjure elemental once per long rest.', prerequisite: { level: 9 } },
  { id: 'mire_mind', name: 'Mire the Mind', description: 'Cast slow once per long rest.', prerequisite: { level: 5 } },
  { id: 'misty_visions', name: 'Misty Visions', description: 'Cast silent image at will.' },
  { id: 'one_with_shadows', name: 'One with Shadows', description: 'Become invisible in dim light or darkness.', prerequisite: { level: 5 } },
  { id: 'otherworldly_leap', name: 'Otherworldly Leap', description: 'Cast jump on yourself at will.', prerequisite: { level: 9 } },
  { id: 'repelling_blast', name: 'Repelling Blast', description: 'Push creature 10 feet with eldritch blast.', prerequisite: { cantripRequired: 'Eldritch Blast' } },
  { id: 'sculptor_flesh', name: 'Sculptor of Flesh', description: 'Cast polymorph once per long rest.', prerequisite: { level: 7 } },
  { id: 'sign_ill_omen', name: 'Sign of Ill Omen', description: 'Cast bestow curse once per long rest.', prerequisite: { level: 5 } },
  { id: 'thief_five_fates', name: 'Thief of Five Fates', description: 'Cast bane once per long rest.' },
  { id: 'thirsting_blade', name: 'Thirsting Blade', description: 'Attack twice with pact weapon.', prerequisite: { level: 5, pactBoon: 'Pact of the Blade' } },
  { id: 'visions_distant_realms', name: 'Visions of Distant Realms', description: 'Cast arcane eye at will.', prerequisite: { level: 15 } },
  { id: 'voice_chain_master', name: 'Voice of the Chain Master', description: 'Communicate telepathically with and perceive through your familiar.', prerequisite: { pactBoon: 'Pact of the Chain' } },
  { id: 'whispers_grave', name: 'Whispers of the Grave', description: 'Cast speak with dead at will.', prerequisite: { level: 9 } },
  { id: 'witch_sight', name: 'Witch Sight', description: 'See true form of shapeshifters and creatures concealed by magic.', prerequisite: { level: 15 } },
];

// Pact Boon options
export const PACT_BOONS = [
  { id: 'chain', name: 'Pact of the Chain', description: 'Learn find familiar spell and can summon special familiars (imp, pseudodragon, quasit, or sprite).' },
  { id: 'blade', name: 'Pact of the Blade', description: 'Create a pact weapon that can take any melee weapon form.' },
  { id: 'tome', name: 'Pact of the Tome', description: 'Receive a Book of Shadows with three cantrips from any class spell lists.' },
];

// Expertise skills (Bard/Rogue)
export const EXPERTISE_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

// Complete class rules
export const CLASS_LEVEL_UP_RULES: Record<string, ClassLevelUpRules> = {
  Barbarian: {
    className: 'Barbarian',
    hitDie: 12,
    spellcasting: { type: 'none', ability: null, canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: {},
    resourceProgression: [
      {
        key: 'rage',
        label: 'Rage',
        formula: (level) => level >= 20 ? 999 : level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2,
        recharge: 'long',
        startLevel: 1,
      },
    ],
    featureChoiceLevels: {
      3: [{ type: 'totem', count: 1 }], // Primal Path choice
    },
    subclassLevel: 3,
    extraAttackLevel: 5,
  },

  Bard: {
    className: 'Bard',
    hitDie: 8,
    spellcasting: { type: 'known', ability: 'cha', canSwapOnLevelUp: true, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 2, 4: 3, 10: 4 },
    resourceProgression: [
      {
        key: 'bardic_inspiration',
        label: 'Bardic Inspiration',
        formula: (level, chaMod = 0) => Math.max(1, chaMod),
        recharge: 'long', // Becomes short rest at level 5
        startLevel: 1,
      },
    ],
    featureChoiceLevels: {
      3: [{ type: 'expertise', count: 2 }],
      10: [{ type: 'expertise', count: 2 }, { type: 'magical_secrets', count: 2 }],
      14: [{ type: 'magical_secrets', count: 2 }],
      18: [{ type: 'magical_secrets', count: 2 }],
    },
    subclassLevel: 3,
  },

  Cleric: {
    className: 'Cleric',
    hitDie: 8,
    spellcasting: { type: 'prepared', ability: 'wis', canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 3, 4: 4, 10: 5 },
    resourceProgression: [
      {
        key: 'channel_divinity',
        label: 'Channel Divinity',
        formula: (level) => level >= 18 ? 3 : level >= 6 ? 2 : 1,
        recharge: 'short',
        startLevel: 2,
      },
    ],
    featureChoiceLevels: {
      1: [{ type: 'divine_domain', count: 1 }],
    },
    subclassLevel: 1,
  },

  Druid: {
    className: 'Druid',
    hitDie: 8,
    spellcasting: { type: 'prepared', ability: 'wis', canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 2, 4: 3, 10: 4 },
    resourceProgression: [
      {
        key: 'wild_shape',
        label: 'Wild Shape',
        formula: () => 2,
        recharge: 'short',
        startLevel: 2,
      },
    ],
    featureChoiceLevels: {
      2: [{ type: 'land_circle', count: 1 }],
    },
    subclassLevel: 2,
  },

  Fighter: {
    className: 'Fighter',
    hitDie: 10,
    spellcasting: { type: 'none', ability: null, canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 6, 8, 12, 14, 16, 19], // Fighter gets extra ASIs
    cantripProgression: {},
    resourceProgression: [
      {
        key: 'second_wind',
        label: 'Second Wind',
        formula: () => 1,
        recharge: 'short',
        startLevel: 1,
      },
      {
        key: 'action_surge',
        label: 'Action Surge',
        formula: (level) => level >= 17 ? 2 : 1,
        recharge: 'short',
        startLevel: 2,
      },
      {
        key: 'indomitable',
        label: 'Indomitable',
        formula: (level) => level >= 17 ? 3 : level >= 13 ? 2 : 1,
        recharge: 'long',
        startLevel: 9,
      },
    ],
    featureChoiceLevels: {
      1: [{ type: 'fighting_style', count: 1, options: FIGHTING_STYLES.Fighter }],
    },
    subclassLevel: 3,
    extraAttackLevel: 5,
  },

  Monk: {
    className: 'Monk',
    hitDie: 8,
    spellcasting: { type: 'none', ability: null, canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: {},
    resourceProgression: [
      {
        key: 'ki_points',
        label: 'Ki Points',
        formula: (level) => level,
        recharge: 'short',
        startLevel: 2,
      },
    ],
    featureChoiceLevels: {
      3: [{ type: 'monastic_tradition', count: 1 }],
    },
    subclassLevel: 3,
    extraAttackLevel: 5,
  },

  Paladin: {
    className: 'Paladin',
    hitDie: 10,
    spellcasting: { type: 'prepared', ability: 'cha', canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: {},
    resourceProgression: [
      {
        key: 'lay_on_hands',
        label: 'Lay on Hands',
        formula: (level) => level * 5,
        recharge: 'long',
        startLevel: 1,
      },
      {
        key: 'channel_divinity',
        label: 'Channel Divinity',
        formula: () => 1,
        recharge: 'short',
        startLevel: 3,
      },
      {
        key: 'divine_sense',
        label: 'Divine Sense',
        formula: (level, chaMod = 0) => 1 + Math.max(0, chaMod),
        recharge: 'long',
        startLevel: 1,
      },
    ],
    featureChoiceLevels: {
      2: [{ type: 'fighting_style', count: 1, options: FIGHTING_STYLES.Paladin }],
      3: [{ type: 'sacred_oath', count: 1 }],
    },
    subclassLevel: 3,
    extraAttackLevel: 5,
  },

  Ranger: {
    className: 'Ranger',
    hitDie: 10,
    spellcasting: { type: 'known', ability: 'wis', canSwapOnLevelUp: true, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: {},
    resourceProgression: [],
    featureChoiceLevels: {
      1: [{ type: 'favored_enemy', count: 1 }, { type: 'favored_terrain', count: 1 }],
      2: [{ type: 'fighting_style', count: 1, options: FIGHTING_STYLES.Ranger }],
      6: [{ type: 'favored_enemy', count: 1 }, { type: 'favored_terrain', count: 1 }],
      10: [{ type: 'favored_terrain', count: 1 }],
      14: [{ type: 'favored_enemy', count: 1 }],
    },
    subclassLevel: 3,
    extraAttackLevel: 5,
  },

  Rogue: {
    className: 'Rogue',
    hitDie: 8,
    spellcasting: { type: 'none', ability: null, canSwapOnLevelUp: false, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 10, 12, 16, 19], // Rogue gets extra ASI at 10
    cantripProgression: {},
    resourceProgression: [],
    featureChoiceLevels: {
      1: [{ type: 'expertise', count: 2 }],
      6: [{ type: 'expertise', count: 2 }],
    },
    subclassLevel: 3,
  },

  Sorcerer: {
    className: 'Sorcerer',
    hitDie: 6,
    spellcasting: { type: 'known', ability: 'cha', canSwapOnLevelUp: true, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 4, 4: 5, 10: 6 },
    resourceProgression: [
      {
        key: 'sorcery_points',
        label: 'Sorcery Points',
        formula: (level) => level,
        recharge: 'long',
        startLevel: 2,
      },
    ],
    featureChoiceLevels: {
      1: [{ type: 'sorcerous_origin', count: 1 }],
      3: [{ type: 'metamagic', count: 2 }],
      10: [{ type: 'metamagic', count: 1 }],
      17: [{ type: 'metamagic', count: 1 }],
    },
    subclassLevel: 1,
  },

  Warlock: {
    className: 'Warlock',
    hitDie: 8,
    spellcasting: { type: 'pact', ability: 'cha', canSwapOnLevelUp: true, spellsPerLevelUp: 0 },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 2, 4: 3, 10: 4 },
    resourceProgression: [],
    featureChoiceLevels: {
      1: [{ type: 'otherworldly_patron', count: 1 }],
      2: [{ type: 'invocation', count: 2 }],
      3: [{ type: 'pact_boon', count: 1 }],
      5: [{ type: 'invocation', count: 1, replaceCount: 1 }],
      7: [{ type: 'invocation', count: 1, replaceCount: 1 }],
      9: [{ type: 'invocation', count: 1, replaceCount: 1 }],
      12: [{ type: 'invocation', count: 1, replaceCount: 1 }],
      15: [{ type: 'invocation', count: 1, replaceCount: 1 }],
      18: [{ type: 'invocation', count: 1, replaceCount: 1 }],
    },
    subclassLevel: 1,
  },

  Wizard: {
    className: 'Wizard',
    hitDie: 6,
    spellcasting: { type: 'spellbook', ability: 'int', canSwapOnLevelUp: false, spellsPerLevelUp: 2, learnFromScrolls: true },
    asiLevels: [4, 8, 12, 16, 19],
    cantripProgression: { 1: 3, 4: 4, 10: 5 },
    resourceProgression: [
      {
        key: 'arcane_recovery',
        label: 'Arcane Recovery',
        formula: () => 1,
        recharge: 'long',
        startLevel: 1,
      },
    ],
    featureChoiceLevels: {
      2: [{ type: 'arcane_tradition', count: 1 }],
    },
    subclassLevel: 2,
  },
};

// Known caster spells known progression tables
export const SPELLS_KNOWN_PROGRESSION: Record<string, number[]> = {
  Bard: [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  Sorcerer: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  Warlock: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  Ranger: [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
};

// Helper functions
export function getClassRules(className: string): ClassLevelUpRules | null {
  return CLASS_LEVEL_UP_RULES[className] || null;
}

export function getSpellsKnownAtLevel(className: string, level: number): number {
  const progression = SPELLS_KNOWN_PROGRESSION[className];
  if (!progression) return 0;
  return progression[Math.min(level, 20)] || 0;
}

export function getSpellsKnownGain(className: string, fromLevel: number, toLevel: number): number {
  return getSpellsKnownAtLevel(className, toLevel) - getSpellsKnownAtLevel(className, fromLevel);
}

export function getCantripCountAtLevel(className: string, level: number): number {
  const rules = CLASS_LEVEL_UP_RULES[className];
  if (!rules || !rules.cantripProgression) return 0;
  
  const levels = Object.keys(rules.cantripProgression).map(Number).sort((a, b) => b - a);
  for (const l of levels) {
    if (level >= l) {
      return rules.cantripProgression[l];
    }
  }
  return 0;
}

export function getCantripGain(className: string, fromLevel: number, toLevel: number): number {
  return getCantripCountAtLevel(className, toLevel) - getCantripCountAtLevel(className, fromLevel);
}

export function getFeatureChoicesAtLevel(className: string, level: number): FeatureChoice[] {
  const rules = CLASS_LEVEL_UP_RULES[className];
  if (!rules) return [];
  return rules.featureChoiceLevels[level] || [];
}

export function isASILevel(className: string, level: number): boolean {
  const rules = CLASS_LEVEL_UP_RULES[className];
  if (!rules) return false;
  return rules.asiLevels.includes(level);
}

export function getMaxSpellLevelForClass(className: string, level: number): number {
  const rules = CLASS_LEVEL_UP_RULES[className];
  if (!rules || rules.spellcasting.type === 'none') return 0;
  
  // Full casters
  if (['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(className)) {
    if (level >= 17) return 9;
    if (level >= 15) return 8;
    if (level >= 13) return 7;
    if (level >= 11) return 6;
    if (level >= 9) return 5;
    if (level >= 7) return 4;
    if (level >= 5) return 3;
    if (level >= 3) return 2;
    return 1;
  }
  
  // Half casters (Paladin, Ranger)
  if (['Paladin', 'Ranger'].includes(className)) {
    if (level >= 17) return 5;
    if (level >= 13) return 4;
    if (level >= 9) return 3;
    if (level >= 5) return 2;
    if (level >= 2) return 1;
    return 0;
  }
  
  // Warlock (pact magic)
  if (className === 'Warlock') {
    if (level >= 9) return 5;
    if (level >= 7) return 4;
    if (level >= 5) return 3;
    if (level >= 3) return 2;
    return 1;
  }
  
  return 0;
}

export function getInvocationsKnownAtLevel(level: number): number {
  if (level >= 18) return 8;
  if (level >= 15) return 7;
  if (level >= 12) return 6;
  if (level >= 9) return 5;
  if (level >= 7) return 4;
  if (level >= 5) return 3;
  if (level >= 2) return 2;
  return 0;
}

export function filterInvocationsByPrerequisites(
  invocations: typeof ELDRITCH_INVOCATIONS,
  warlockLevel: number,
  pactBoon: string | null,
  knownCantrips: string[]
): typeof ELDRITCH_INVOCATIONS {
  return invocations.filter(inv => {
    if (!inv.prerequisite) return true;
    
    const prereq = inv.prerequisite as any;
    if (prereq.level && warlockLevel < prereq.level) return false;
    if (prereq.pactBoon && pactBoon !== prereq.pactBoon) return false;
    if (prereq.cantripRequired && !knownCantrips.includes(prereq.cantripRequired)) return false;
    
    return true;
  });
}
