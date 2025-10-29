import { atom } from "jotai";
import type { Grants, ChoiceNeeds } from "@/lib/rules/5eRules";
import { emptyGrants, mergeGrants } from "@/lib/rules/5eRules";

export type WizardDraft = {
  // Core identity
  name: string;
  className?: string;
  level: number;
  classId?: string;
  subclassId?: string;
  ancestryId?: string;
  subAncestryId?: string;
  backgroundId?: string;
  
  // Ability scores (chosen in StepAbilities)
  abilityScores: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  abilityMethod: string;
  
  // Description fields
  alignment?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  personality?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  notes?: string;
  
  // Player choices
  choices: {
    skills: string[];
    tools: string[];
    languages: string[];
    equipmentBundleId?: string;
    spellsKnown: string[];
    spellsPrepared: string[];
    featureChoices: Record<string, string[]>;
  };
  
  // Auto-granted by rules
  grants: Grants;
  
  // Current needs (computed from selections)
  needs: ChoiceNeeds;
};

export const draftAtom = atom<WizardDraft>({
  name: "",
  level: 1,
  abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
  abilityMethod: "standard-array",
  choices: {
    skills: [],
    tools: [],
    languages: [],
    spellsKnown: [],
    spellsPrepared: [],
    featureChoices: {},
  },
  grants: emptyGrants(),
  needs: {},
});

// === ACTIONS ===

export const setNameAtom = atom(null, (get, set, name: string) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, name });
});

export const setLevelAtom = atom(null, (get, set, level: number) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, level });
});

export const setClassAtom = atom(null, (get, set, payload: { classId: string, className: string }) => {
  const d = get(draftAtom);
  set(draftAtom, { 
    ...d, 
    classId: payload.classId,
    className: payload.className,
    subclassId: undefined,
    choices: { ...d.choices, skills: [], tools: [] }
  });
});

export const setSubclassAtom = atom(null, (get, set, subclassId: string) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, subclassId });
});

export const setAncestryAtom = atom(null, (get, set, ancestryId: string) => {
  const d = get(draftAtom);
  set(draftAtom, { 
    ...d, 
    ancestryId, 
    subAncestryId: undefined 
  });
});

export const setSubAncestryAtom = atom(null, (get, set, subAncestryId: string) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, subAncestryId });
});

export const setBackgroundAtom = atom(null, (get, set, backgroundId: string) => {
  const d = get(draftAtom);
  set(draftAtom, { 
    ...d, 
    backgroundId,
    choices: { ...d.choices, skills: [], tools: [], languages: [] }
  });
});

export const setAbilityScoresAtom = atom(
  null, 
  (get, set, scores: Partial<WizardDraft['abilityScores']>) => {
    const d = get(draftAtom);
    set(draftAtom, { 
      ...d, 
      abilityScores: { ...d.abilityScores, ...scores } 
    });
  }
);

export const setAbilityMethodAtom = atom(null, (get, set, method: string) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, abilityMethod: method });
});

export const applyGrantsAtom = atom(null, (get, set, newGrants: Grants) => {
  const d = get(draftAtom);
  set(draftAtom, {
    ...d,
    grants: mergeGrants(d.grants, newGrants),
  });
});

export const replaceGrantsAtom = atom(null, (get, set, grants: Grants) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, grants });
});

export const setNeedsAtom = atom(null, (get, set, needs: Partial<ChoiceNeeds>) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, needs: { ...d.needs, ...needs } });
});

export const toggleSkillAtom = atom(null, (get, set, skill: string) => {
  const d = get(draftAtom);
  const skills = d.choices.skills.includes(skill)
    ? d.choices.skills.filter(s => s !== skill)
    : [...d.choices.skills, skill];
  set(draftAtom, { ...d, choices: { ...d.choices, skills } });
});

export const toggleToolAtom = atom(null, (get, set, tool: string) => {
  const d = get(draftAtom);
  const tools = d.choices.tools.includes(tool)
    ? d.choices.tools.filter(t => t !== tool)
    : [...d.choices.tools, tool];
  set(draftAtom, { ...d, choices: { ...d.choices, tools } });
});

export const toggleLanguageAtom = atom(null, (get, set, language: string) => {
  const d = get(draftAtom);
  const languages = d.choices.languages.includes(language)
    ? d.choices.languages.filter(l => l !== language)
    : [...d.choices.languages, language];
  set(draftAtom, { ...d, choices: { ...d.choices, languages } });
});

export const setEquipmentBundleAtom = atom(null, (get, set, bundleId: string) => {
  const d = get(draftAtom);
  set(draftAtom, { ...d, choices: { ...d.choices, equipmentBundleId: bundleId } });
});

export const toggleSpellKnownAtom = atom(null, (get, set, spellId: string) => {
  const d = get(draftAtom);
  const spells = d.choices.spellsKnown.includes(spellId)
    ? d.choices.spellsKnown.filter(s => s !== spellId)
    : [...d.choices.spellsKnown, spellId];
  set(draftAtom, { ...d, choices: { ...d.choices, spellsKnown: spells } });
});

export const toggleSpellPreparedAtom = atom(null, (get, set, spellId: string) => {
  const d = get(draftAtom);
  const spells = d.choices.spellsPrepared.includes(spellId)
    ? d.choices.spellsPrepared.filter(s => s !== spellId)
    : [...d.choices.spellsPrepared, spellId];
  set(draftAtom, { ...d, choices: { ...d.choices, spellsPrepared: spells } });
});

export const resetDraftAtom = atom(null, (get, set) => {
  set(draftAtom, {
    name: "",
    level: 1,
    abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    abilityMethod: "standard-array",
    choices: {
      skills: [],
      tools: [],
      languages: [],
      spellsKnown: [],
      spellsPrepared: [],
      featureChoices: {},
    },
    grants: emptyGrants(),
    needs: {},
  });
});
