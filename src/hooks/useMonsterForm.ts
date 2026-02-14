import { useState, useCallback } from "react";

export interface MonsterAction {
  id: string;
  name: string;
  description: string;
  category: "action" | "bonus_action" | "reaction" | "legendary" | "lair";
  attackBonus?: number;
  reach?: string;
  damageDice?: string;
  damageType?: string;
  saveDC?: number;
  saveAbility?: string;
  recharge?: string;
}

export interface MonsterFormData {
  // Step 1 - Start
  startType: "blank" | "existing" | "template";
  name: string;
  campaignId?: string;
  derivedFromMonsterId?: string;
  derivedFromSource?: "catalog" | "homebrew";

  // Step 2 - Identity
  size: string;
  type: string;
  subtype: string;
  alignment: string;
  cr: number;
  proficiencyBonus: number;

  // Step 3 - Defenses
  ac: number;
  armorDescription: string;
  hpAvg: number;
  hpFormula: string;
  speeds: {
    walk: number;
    fly: number;
    swim: number;
    climb: number;
    burrow: number;
  };

  // Step 4 - Abilities
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  saveProficiencies: { str: boolean; dex: boolean; con: boolean; int: boolean; wis: boolean; cha: boolean };
  skills: Record<string, number>;

  // Step 5 - Traits
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  senses: Record<string, number | string>;
  languages: string;

  // Step 6 - Actions
  actions: MonsterAction[];

  // Step 7 - Spellcasting
  hasSpellcasting: boolean;
  spellcasting: {
    ability: string;
    saveDC: number;
    attackBonus: number;
    mode: "innate" | "slots";
    spells: Record<string, string[]>;
  };

  // Step 8 - Finalize
  tags: string[];
  isPublished: boolean;
  traits: { name: string; description: string }[];
}

const CR_PROFICIENCY: Record<number, number> = {
  0: 2, 0.125: 2, 0.25: 2, 0.5: 2,
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
  21: 7, 22: 7, 23: 7, 24: 7,
  25: 8, 26: 8, 27: 8, 28: 8,
  29: 9, 30: 9,
};

export function getDefaultFormData(): MonsterFormData {
  return {
    startType: "blank",
    name: "",
    size: "Medium",
    type: "beast",
    subtype: "",
    alignment: "",
    cr: 1,
    proficiencyBonus: 2,
    ac: 10,
    armorDescription: "",
    hpAvg: 10,
    hpFormula: "",
    speeds: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0 },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skills: {},
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditionImmunities: [],
    senses: {},
    languages: "",
    actions: [],
    hasSpellcasting: false,
    spellcasting: { ability: "int", saveDC: 13, attackBonus: 5, mode: "slots", spells: {} },
    tags: [],
    isPublished: false,
    traits: [],
  };
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function useMonsterForm(initial?: Partial<MonsterFormData>) {
  const [formData, setFormData] = useState<MonsterFormData>({ ...getDefaultFormData(), ...initial });
  const [currentStep, setCurrentStep] = useState(0);

  const updateField = useCallback(<K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === "cr") {
        next.proficiencyBonus = CR_PROFICIENCY[value as number] ?? 2;
      }
      return next;
    });
  }, []);

  const nextStep = useCallback(() => setCurrentStep(s => Math.min(s + 1, 7)), []);
  const prevStep = useCallback(() => setCurrentStep(s => Math.max(s - 1, 0)), []);
  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  return { formData, setFormData, updateField, currentStep, nextStep, prevStep, goToStep };
}
