/**
 * Test fixtures for combat scenarios
 * Used for integration testing and validation
 */

export interface TestCharacter {
  name: string;
  class: string;
  level: number;
  max_hp: number;
  current_hp: number;
  ac: number;
  str_save: number;
  dex_save: number;
  con_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
  resistances: string[];
  vulnerabilities: string[];
  immunities: string[];
}

export interface TestScenario {
  name: string;
  description: string;
  characters: TestCharacter[];
  expectedOutcomes: string[];
}

export const testCharacters: Record<string, TestCharacter> = {
  tankFighter: {
    name: "Tank Fighter",
    class: "Fighter",
    level: 5,
    max_hp: 45,
    current_hp: 45,
    ac: 18,
    str_save: 5,
    dex_save: 1,
    con_save: 4,
    int_save: 0,
    wis_save: 1,
    cha_save: 0,
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  },
  glassCannon: {
    name: "Glass Cannon Wizard",
    class: "Wizard",
    level: 5,
    max_hp: 22,
    current_hp: 22,
    ac: 12,
    str_save: 0,
    dex_save: 3,
    con_save: 1,
    int_save: 6,
    wis_save: 2,
    cha_save: 0,
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  },
  fireResistant: {
    name: "Fire Genasi Barbarian",
    class: "Barbarian",
    level: 5,
    max_hp: 52,
    current_hp: 52,
    ac: 15,
    str_save: 5,
    dex_save: 2,
    con_save: 5,
    int_save: 0,
    wis_save: 1,
    cha_save: 0,
    resistances: ["fire"],
    vulnerabilities: [],
    immunities: [],
  },
  undead: {
    name: "Undead Creature",
    class: "Monster",
    level: 3,
    max_hp: 30,
    current_hp: 30,
    ac: 13,
    str_save: 2,
    dex_save: 1,
    con_save: 0,
    int_save: -2,
    wis_save: 0,
    cha_save: -1,
    resistances: ["necrotic", "cold"],
    vulnerabilities: ["radiant"],
    immunities: ["poison"],
  },
};

export const testScenarios: TestScenario[] = [
  {
    name: "Basic Damage Application",
    description: "Apply 10 slashing damage to tank fighter",
    characters: [testCharacters.tankFighter],
    expectedOutcomes: [
      "Tank Fighter should have 35 HP (45 - 10)",
      "No concentration check needed",
      "No death saves needed",
    ],
  },
  {
    name: "Resistance Application",
    description: "Apply 20 fire damage to fire genasi",
    characters: [testCharacters.fireResistant],
    expectedOutcomes: [
      "Fire Genasi should take 10 damage (resistance halves)",
      "Fire Genasi should have 42 HP (52 - 10)",
    ],
  },
  {
    name: "Vulnerability Application",
    description: "Apply 10 radiant damage to undead",
    characters: [testCharacters.undead],
    expectedOutcomes: [
      "Undead should take 20 damage (vulnerability doubles)",
      "Undead should have 10 HP (30 - 20)",
    ],
  },
  {
    name: "Immunity Application",
    description: "Apply 15 poison damage to undead",
    characters: [testCharacters.undead],
    expectedOutcomes: [
      "Undead should take 0 damage (immunity)",
      "Undead should remain at 30 HP",
    ],
  },
  {
    name: "Concentration Check - Low Damage",
    description: "Apply 8 damage while concentrating",
    characters: [testCharacters.glassCannon],
    expectedOutcomes: [
      "Wizard takes 8 damage",
      "Concentration DC should be 10 (minimum)",
      "Wizard has +1 CON save",
    ],
  },
  {
    name: "Concentration Check - High Damage",
    description: "Apply 30 damage while concentrating",
    characters: [testCharacters.glassCannon],
    expectedOutcomes: [
      "Wizard takes 30 damage",
      "Concentration DC should be 15 (30/2)",
      "Wizard likely fails (only +1 CON save)",
    ],
  },
  {
    name: "Death Save Scenario",
    description: "Reduce glass cannon to 0 HP",
    characters: [testCharacters.glassCannon],
    expectedOutcomes: [
      "Wizard drops to 0 HP",
      "Death save tracking begins",
      "Needs 3 successes to stabilize or 3 failures to die",
    ],
  },
  {
    name: "Multi-Target Scenario",
    description: "Fireball hits multiple targets",
    characters: [
      testCharacters.tankFighter,
      testCharacters.glassCannon,
      testCharacters.fireResistant,
    ],
    expectedOutcomes: [
      "Tank Fighter takes full damage",
      "Glass Cannon takes full damage (likely goes down)",
      "Fire Genasi takes half damage (resistance)",
      "All must make DEX saves",
    ],
  },
];

export const turnAdvanceTestData = {
  scenario: "Turn advance should reset action economy",
  setup: {
    character: testCharacters.tankFighter,
    actionState: {
      action_used: true,
      bonus_action_used: true,
      reaction_used: true,
    },
  },
  expectedOutcome: {
    action_used: false,
    bonus_action_used: false,
    reaction_used: false,
  },
};

export const effectTickTestData = {
  scenario: "Effects should tick down on turn advance",
  setup: {
    effect: {
      name: "Bless",
      start_round: 1,
      end_round: 11, // 10 rounds duration
      ticks_at: "end",
    },
    currentRound: 5,
  },
  expectedOutcome: {
    shouldExpire: false,
    remainingRounds: 6,
  },
};
