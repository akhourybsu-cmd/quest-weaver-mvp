export interface ConditionInfo {
  name: string;
  description: string;
  effects: string[];
  source?: string;
}

export const CONDITION_TOOLTIPS: Record<string, ConditionInfo> = {
  blinded: {
    name: "Blinded",
    description: "A blinded creature can't see and automatically fails any ability check that requires sight.",
    effects: [
      "Attack rolls against the creature have advantage",
      "The creature's attack rolls have disadvantage"
    ],
    source: "PHB p.290"
  },
  charmed: {
    name: "Charmed",
    description: "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects.",
    effects: [
      "The charmer has advantage on ability checks to interact socially with the creature"
    ],
    source: "PHB p.290"
  },
  deafened: {
    name: "Deafened",
    description: "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
    effects: [
      "Cannot hear sounds or voices"
    ],
    source: "PHB p.290"
  },
  frightened: {
    name: "Frightened",
    description: "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.",
    effects: [
      "Disadvantage on ability checks and attack rolls",
      "Can't willingly move closer to source of fear"
    ],
    source: "PHB p.290"
  },
  grappled: {
    name: "Grappled",
    description: "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
    effects: [
      "Speed becomes 0",
      "Condition ends if grappler is incapacitated",
      "Condition ends if effect removes the creature from grappler's reach"
    ],
    source: "PHB p.290"
  },
  incapacitated: {
    name: "Incapacitated",
    description: "An incapacitated creature can't take actions or reactions.",
    effects: [
      "Cannot take actions",
      "Cannot take reactions"
    ],
    source: "PHB p.290"
  },
  invisible: {
    name: "Invisible",
    description: "An invisible creature is impossible to see without the aid of magic or a special sense.",
    effects: [
      "Considered heavily obscured for hiding",
      "Attack rolls against creature have disadvantage",
      "Creature's attack rolls have advantage"
    ],
    source: "PHB p.291"
  },
  paralyzed: {
    name: "Paralyzed",
    description: "A paralyzed creature is incapacitated and can't move or speak.",
    effects: [
      "Cannot move or speak",
      "Automatically fails STR and DEX saves",
      "Attack rolls against creature have advantage",
      "Attacks within 5ft are critical hits if they hit"
    ],
    source: "PHB p.291"
  },
  petrified: {
    name: "Petrified",
    description: "A petrified creature is transformed, along with any nonmagical objects it is wearing or carrying, into a solid inanimate substance (usually stone).",
    effects: [
      "Weight increases by factor of 10",
      "Ceases aging",
      "Incapacitated, can't move or speak",
      "Unaware of surroundings",
      "Attack rolls have advantage",
      "Auto-fails STR and DEX saves",
      "Resistance to all damage",
      "Immune to poison and disease"
    ],
    source: "PHB p.291"
  },
  poisoned: {
    name: "Poisoned",
    description: "A poisoned creature has disadvantage on attack rolls and ability checks.",
    effects: [
      "Disadvantage on attack rolls",
      "Disadvantage on ability checks"
    ],
    source: "PHB p.292"
  },
  prone: {
    name: "Prone",
    description: "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition.",
    effects: [
      "Disadvantage on attack rolls",
      "Attack rolls within 5ft have advantage",
      "Attack rolls beyond 5ft have disadvantage",
      "Costs half movement to stand up"
    ],
    source: "PHB p.292"
  },
  restrained: {
    name: "Restrained",
    description: "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
    effects: [
      "Speed becomes 0",
      "Attack rolls have disadvantage",
      "Attack rolls against creature have advantage",
      "Disadvantage on DEX saves"
    ],
    source: "PHB p.292"
  },
  stunned: {
    name: "Stunned",
    description: "A stunned creature is incapacitated, can't move, and can speak only falteringly.",
    effects: [
      "Incapacitated",
      "Can't move",
      "Can speak only falteringly",
      "Auto-fails STR and DEX saves",
      "Attack rolls against creature have advantage"
    ],
    source: "PHB p.292"
  },
  unconscious: {
    name: "Unconscious",
    description: "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings.",
    effects: [
      "Incapacitated and can't move or speak",
      "Unaware of surroundings",
      "Drops whatever it's holding and falls prone",
      "Auto-fails STR and DEX saves",
      "Attack rolls have advantage",
      "Attacks within 5ft are critical hits if they hit"
    ],
    source: "PHB p.292"
  },
  exhaustion_1: {
    name: "Exhaustion (Level 1)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Disadvantage on ability checks"
    ],
    source: "PHB p.291"
  },
  exhaustion_2: {
    name: "Exhaustion (Level 2)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Disadvantage on ability checks",
      "Speed halved"
    ],
    source: "PHB p.291"
  },
  exhaustion_3: {
    name: "Exhaustion (Level 3)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Disadvantage on ability checks",
      "Speed halved",
      "Disadvantage on attack rolls and saving throws"
    ],
    source: "PHB p.291"
  },
  exhaustion_4: {
    name: "Exhaustion (Level 4)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Disadvantage on ability checks",
      "Speed halved",
      "Disadvantage on attack rolls and saving throws",
      "Hit point maximum halved"
    ],
    source: "PHB p.291"
  },
  exhaustion_5: {
    name: "Exhaustion (Level 5)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Disadvantage on ability checks",
      "Speed halved",
      "Disadvantage on attack rolls and saving throws",
      "Hit point maximum halved",
      "Speed reduced to 0"
    ],
    source: "PHB p.291"
  },
  exhaustion_6: {
    name: "Exhaustion (Level 6)",
    description: "Exhaustion is measured in six levels.",
    effects: [
      "Death"
    ],
    source: "PHB p.291"
  }
};
