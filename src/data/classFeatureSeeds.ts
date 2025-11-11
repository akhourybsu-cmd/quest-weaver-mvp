/**
 * SRD Class Feature Seeds
 * Pilot: Fighter, Rogue, Cleric, Warlock, Sorcerer
 * Levels 1-5 for proof of concept
 */

export interface ClassFeatureSeed {
  class_name: string;
  level: number;
  name: string;
  description: string;
  rules_json: any;
  choices_json?: any;
  tags: string[];
}

export const CLASS_FEATURE_SEEDS: ClassFeatureSeed[] = [
  // ==================== FIGHTER ====================
  {
    class_name: 'Fighter',
    level: 1,
    name: 'Fighting Style',
    description: 'Choose a fighting style that reflects your combat specialty.',
    rules_json: {},
    choices_json: {
      fighting_style: {
        type: 'fighting_style',
        count: 1,
        options: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting']
      }
    },
    tags: ['choice', 'combat']
  },
  {
    class_name: 'Fighter',
    level: 1,
    name: 'Second Wind',
    description: 'You can use a bonus action to regain HP equal to 1d10 + fighter level.',
    rules_json: {
      grantResource: {
        key: 'second_wind',
        label: 'Second Wind',
        maxFormula: '1',
        recharge: 'short'
      }
    },
    tags: ['healing', 'bonus-action']
  },
  {
    class_name: 'Fighter',
    level: 2,
    name: 'Action Surge',
    description: 'You can take one additional action on your turn.',
    rules_json: {
      grantResource: {
        key: 'action_surge',
        label: 'Action Surge',
        maxFormula: '1',
        recharge: 'short'
      }
    },
    tags: ['action-economy']
  },
  {
    class_name: 'Fighter',
    level: 3,
    name: 'Martial Archetype',
    description: 'Choose a martial archetype (subclass).',
    rules_json: {},
    tags: ['subclass']
  },
  {
    class_name: 'Fighter',
    level: 4,
    name: 'Ability Score Improvement',
    description: 'Increase one ability score by 2, or two ability scores by 1 each, or take a feat.',
    rules_json: { asi: true },
    tags: ['asi', 'feat']
  },
  {
    class_name: 'Fighter',
    level: 5,
    name: 'Extra Attack',
    description: 'You can attack twice, instead of once, when you take the Attack action.',
    rules_json: {},
    tags: ['combat', 'attack']
  },

  // ==================== ROGUE ====================
  {
    class_name: 'Rogue',
    level: 1,
    name: 'Expertise',
    description: 'Choose two skills you are proficient in. Your proficiency bonus is doubled for any ability check using those skills.',
    rules_json: {},
    choices_json: {
      expertise: {
        type: 'expertise',
        count: 2,
        options: ['skill_proficient'] // Will be filtered by character's proficiencies
      }
    },
    tags: ['choice', 'skill']
  },
  {
    class_name: 'Rogue',
    level: 1,
    name: 'Sneak Attack',
    description: 'Deal extra 1d6 damage when you have advantage or an ally is within 5 ft of target.',
    rules_json: {},
    tags: ['damage', 'combat']
  },
  {
    class_name: 'Rogue',
    level: 2,
    name: 'Cunning Action',
    description: 'You can Dash, Disengage, or Hide as a bonus action.',
    rules_json: {},
    tags: ['bonus-action', 'mobility']
  },
  {
    class_name: 'Rogue',
    level: 3,
    name: 'Roguish Archetype',
    description: 'Choose a roguish archetype (subclass).',
    rules_json: {},
    tags: ['subclass']
  },
  {
    class_name: 'Rogue',
    level: 4,
    name: 'Ability Score Improvement',
    description: 'Increase one ability score by 2, or two ability scores by 1 each, or take a feat.',
    rules_json: { asi: true },
    tags: ['asi', 'feat']
  },
  {
    class_name: 'Rogue',
    level: 5,
    name: 'Uncanny Dodge',
    description: 'When an attacker you can see hits you with an attack, you can use your reaction to halve the damage.',
    rules_json: {},
    tags: ['reaction', 'defense']
  },

  // ==================== CLERIC ====================
  {
    class_name: 'Cleric',
    level: 1,
    name: 'Divine Domain',
    description: 'Choose a divine domain (subclass).',
    rules_json: {},
    tags: ['subclass']
  },
  {
    class_name: 'Cleric',
    level: 1,
    name: 'Spellcasting',
    description: 'You can cast cleric spells. Wisdom is your spellcasting ability.',
    rules_json: {},
    tags: ['spellcasting']
  },
  {
    class_name: 'Cleric',
    level: 2,
    name: 'Channel Divinity (1/rest)',
    description: 'You can channel divine energy to fuel magical effects.',
    rules_json: {
      grantResource: {
        key: 'channel_divinity',
        label: 'Channel Divinity',
        maxFormula: '1',
        recharge: 'short'
      }
    },
    tags: ['divine', 'resource']
  },
  {
    class_name: 'Cleric',
    level: 2,
    name: 'Channel Divinity: Turn Undead',
    description: 'As an action, present your holy symbol and turn undead.',
    rules_json: {},
    tags: ['divine', 'action']
  },
  {
    class_name: 'Cleric',
    level: 4,
    name: 'Ability Score Improvement',
    description: 'Increase one ability score by 2, or two ability scores by 1 each, or take a feat.',
    rules_json: { asi: true },
    tags: ['asi', 'feat']
  },
  {
    class_name: 'Cleric',
    level: 5,
    name: 'Destroy Undead (CR 1/2)',
    description: 'When you Turn Undead, undead of CR 1/2 or lower are destroyed.',
    rules_json: {},
    tags: ['divine', 'combat']
  },

  // ==================== WARLOCK ====================
  {
    class_name: 'Warlock',
    level: 1,
    name: 'Otherworldly Patron',
    description: 'Choose an otherworldly patron (subclass).',
    rules_json: {},
    tags: ['subclass']
  },
  {
    class_name: 'Warlock',
    level: 1,
    name: 'Pact Magic',
    description: 'You can cast warlock spells. Charisma is your spellcasting ability.',
    rules_json: {},
    tags: ['spellcasting']
  },
  {
    class_name: 'Warlock',
    level: 2,
    name: 'Eldritch Invocations',
    description: 'Choose two eldritch invocations.',
    rules_json: {},
    choices_json: {
      invocations: {
        type: 'invocation',
        count: 2,
        options: [
          'Agonizing Blast', 'Armor of Shadows', 'Beast Speech', 'Beguiling Influence',
          'Book of Ancient Secrets', 'Devil\'s Sight', 'Eldritch Sight', 'Eldritch Spear',
          'Eyes of the Rune Keeper', 'Fiendish Vigor', 'Gaze of Two Minds', 'Mask of Many Faces',
          'Misty Visions', 'Repelling Blast', 'Thief of Five Fates'
        ]
      }
    },
    tags: ['choice', 'invocation']
  },
  {
    class_name: 'Warlock',
    level: 3,
    name: 'Pact Boon',
    description: 'Your patron grants you a pact boon.',
    rules_json: {},
    choices_json: {
      pact_boon: {
        type: 'invocation',
        count: 1,
        options: ['Pact of the Chain', 'Pact of the Blade', 'Pact of the Tome']
      }
    },
    tags: ['choice', 'pact']
  },
  {
    class_name: 'Warlock',
    level: 4,
    name: 'Ability Score Improvement',
    description: 'Increase one ability score by 2, or two ability scores by 1 each, or take a feat.',
    rules_json: { asi: true },
    tags: ['asi', 'feat']
  },
  {
    class_name: 'Warlock',
    level: 5,
    name: 'Additional Invocation',
    description: 'You learn one additional eldritch invocation.',
    rules_json: {},
    choices_json: {
      additional_invocation: {
        type: 'invocation',
        count: 1,
        options: ['any_invocation']
      }
    },
    tags: ['invocation']
  },

  // ==================== SORCERER ====================
  {
    class_name: 'Sorcerer',
    level: 1,
    name: 'Sorcerous Origin',
    description: 'Choose a sorcerous origin (subclass).',
    rules_json: {},
    tags: ['subclass']
  },
  {
    class_name: 'Sorcerer',
    level: 1,
    name: 'Spellcasting',
    description: 'You can cast sorcerer spells. Charisma is your spellcasting ability.',
    rules_json: {},
    tags: ['spellcasting']
  },
  {
    class_name: 'Sorcerer',
    level: 2,
    name: 'Font of Magic',
    description: 'You have sorcery points equal to your sorcerer level.',
    rules_json: {
      grantResource: {
        key: 'sorcery_points',
        label: 'Sorcery Points',
        maxFormula: 'level',
        recharge: 'long'
      }
    },
    tags: ['resource', 'sorcery']
  },
  {
    class_name: 'Sorcerer',
    level: 3,
    name: 'Metamagic',
    description: 'Choose two metamagic options.',
    rules_json: {},
    choices_json: {
      metamagic: {
        type: 'metamagic',
        count: 2,
        options: [
          'Careful Spell', 'Distant Spell', 'Empowered Spell', 'Extended Spell',
          'Heightened Spell', 'Quickened Spell', 'Subtle Spell', 'Twinned Spell'
        ]
      }
    },
    tags: ['choice', 'metamagic']
  },
  {
    class_name: 'Sorcerer',
    level: 4,
    name: 'Ability Score Improvement',
    description: 'Increase one ability score by 2, or two ability scores by 1 each, or take a feat.',
    rules_json: { asi: true },
    tags: ['asi', 'feat']
  },
  {
    class_name: 'Sorcerer',
    level: 5,
    name: 'Magical Guidance',
    description: 'When you make an ability check, you can spend 1 sorcery point to reroll the d20.',
    rules_json: {},
    tags: ['sorcery', 'reroll']
  },
];

/**
 * Seed feat definitions
 */
export const FEAT_SEEDS = [
  {
    name: 'Alert',
    description: 'You gain a +5 bonus to initiative and can\'t be surprised while conscious.',
    rules_json: {},
    prerequisites_json: {},
    tags: ['combat', 'initiative']
  },
  {
    name: 'Athlete',
    description: 'Increase STR or DEX by 1. Climbing doesn\'t cost extra movement. Stand from prone with 5ft movement.',
    rules_json: {
      grantAbilityBonus: { choice: 1 } // Player chooses STR or DEX
    },
    prerequisites_json: {},
    tags: ['half-asi', 'mobility']
  },
  {
    name: 'Tough',
    description: 'Your HP maximum increases by an amount equal to twice your level.',
    rules_json: {},
    prerequisites_json: {},
    tags: ['defense', 'hp']
  },
  {
    name: 'War Caster',
    description: 'Advantage on CON saves to maintain concentration. Cast spells as opportunity attacks. Somatic components with hands full.',
    rules_json: {},
    prerequisites_json: {
      spellcasting: true
    },
    tags: ['spellcasting', 'combat']
  },
  {
    name: 'Lucky',
    description: 'You have 3 luck points. Spend 1 to roll an additional d20 when making an attack, ability check, or saving throw.',
    rules_json: {
      grantResource: {
        key: 'luck_points',
        label: 'Luck Points',
        maxFormula: '3',
        recharge: 'long'
      }
    },
    prerequisites_json: {},
    tags: ['luck', 'reroll']
  },
  {
    name: 'Resilient',
    description: 'Increase one ability score by 1 and gain proficiency in saving throws using that ability.',
    rules_json: {
      grantAbilityBonus: { choice: 1 }
    },
    prerequisites_json: {},
    tags: ['half-asi', 'saves']
  },
];
