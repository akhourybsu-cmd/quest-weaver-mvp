import type { SrdAncestry, SrdBackground, SrdClass, SrdSubclass, SrdSubAncestry, SrdSpell } from "../srd/SRDClient";
import { spellKnownPrepared } from "./spellTables";

export type Grants = {
  savingThrows: Set<string>;
  skillProficiencies: Set<string>;
  toolProficiencies: Set<string>;
  armorProficiencies: Set<string>;
  weaponProficiencies: Set<string>;
  languages: Set<string>;
  features: Array<{ source: string; name: string; level?: number; description?: string }>;
  traits: Array<{ source: string; name: string; description?: string }>;
  abilityBonuses: Record<string, number>;
};

export type ChoiceNeeds = {
  skill?: { required: number; from: string[] };
  tool?: { required: number; from: string[] };
  language?: { required: number; from: string[] };
  equipmentBundles?: Array<{ id: string; label: string; options: any }>;
  spells?: { canPrepare?: number; mustKnow?: number; list: SrdSpell[] };
  featureChoices?: Array<{ key: string; label: string; required: number; from: string[] }>;
};

export function emptyGrants(): Grants {
  return {
    savingThrows: new Set(),
    skillProficiencies: new Set(),
    toolProficiencies: new Set(),
    armorProficiencies: new Set(),
    weaponProficiencies: new Set(),
    languages: new Set(),
    features: [],
    traits: [],
    abilityBonuses: {},
  };
}

export function mergeAbilityBonuses(base: Record<string, number>, delta: Record<string, number>) {
  const out = { ...base };
  Object.entries(delta).forEach(([k, v]) => {
    out[k] = (out[k] ?? 0) + v;
  });
  return out;
}

function normalizeSavingThrow(save: string): string {
  // Convert "str_save" to "STR"
  return save.replace("_save", "").toUpperCase();
}

// === AUTO-GRANTS ===
export function grantsFromClass(cls: SrdClass): Grants {
  const g = emptyGrants();
  
  (cls.saving_throws || []).forEach(s => g.savingThrows.add(normalizeSavingThrow(s)));
  
  const prof = cls.proficiencies || {};
  (prof.armor || []).forEach((a: string) => g.armorProficiencies.add(a));
  (prof.weapons || []).forEach((w: string) => g.weaponProficiencies.add(w));
  
  return g;
}

export function needsFromClass(cls: SrdClass): Partial<ChoiceNeeds> {
  const needs: Partial<ChoiceNeeds> = {};
  const prof = cls.proficiencies || {};
  
  if (prof.skills?.choose && Array.isArray(prof.skills.from)) {
    needs.skill = { required: prof.skills.choose, from: prof.skills.from };
  }
  
  if (prof.tools?.choose && Array.isArray(prof.tools.from)) {
    needs.tool = { required: prof.tools.choose, from: prof.tools.from };
  }
  
  return needs;
}

export function grantsFromAncestry(a: SrdAncestry): Grants {
  const g = emptyGrants();
  
  (a.languages || []).forEach(l => {
    if (typeof l === 'string') {
      g.languages.add(l);
    } else if (l.name && !l.name.toLowerCase().includes('choice')) {
      g.languages.add(l.name);
    }
  });
  
  (a.traits || []).forEach(t => {
    g.traits.push({ 
      source: "ancestry", 
      name: t.name || String(t),
      description: t.description 
    });
  });
  
  // Parse ability bonuses
  (a.ability_bonuses || []).forEach(bonus => {
    const ability = bonus.ability.toUpperCase();
    if (ability !== 'ALL') {
      g.abilityBonuses[ability] = (g.abilityBonuses[ability] || 0) + bonus.bonus;
    } else {
      // "ALL" means +1 to all six abilities
      ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(ab => {
        g.abilityBonuses[ab] = (g.abilityBonuses[ab] || 0) + bonus.bonus;
      });
    }
  });
  
  return g;
}

export function grantsFromSubAncestry(sa: SrdSubAncestry): Grants {
  const g = emptyGrants();
  
  (sa.languages || []).forEach(l => {
    if (typeof l === 'string') {
      g.languages.add(l);
    } else if (l.name && !l.name.toLowerCase().includes('choice')) {
      g.languages.add(l.name);
    }
  });
  
  (sa.traits || []).forEach(t => {
    g.traits.push({ 
      source: "subancestry", 
      name: t.name || String(t),
      description: t.description 
    });
  });
  
  (sa.ability_bonuses || []).forEach(bonus => {
    const ability = bonus.ability.toUpperCase();
    if (ability !== 'ALL') {
      g.abilityBonuses[ability] = (g.abilityBonuses[ability] || 0) + bonus.bonus;
    } else {
      ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(ab => {
        g.abilityBonuses[ab] = (g.abilityBonuses[ab] || 0) + bonus.bonus;
      });
    }
  });
  
  return g;
}

export function grantsFromBackground(bg: SrdBackground): Grants {
  const g = emptyGrants();
  
  // Handle skills
  if (Array.isArray(bg.skill_proficiencies)) {
    bg.skill_proficiencies.forEach(s => {
      const name = typeof s === 'string' ? s : s.name;
      if (name) g.skillProficiencies.add(name);
    });
  }
  
  // Handle tools
  if (Array.isArray(bg.tool_proficiencies)) {
    bg.tool_proficiencies.forEach(t => {
      const name = typeof t === 'string' ? t : t.name;
      if (name) g.toolProficiencies.add(name);
    });
  }
  
  // Handle languages
  if (Array.isArray(bg.languages)) {
    bg.languages.forEach(l => {
      const name = typeof l === 'string' ? l : l.name;
      if (name && !name.toLowerCase().includes('choice')) {
        g.languages.add(name);
      }
    });
  }
  
  // Handle feature
  if (bg.feature && typeof bg.feature === 'object' && bg.feature.name) {
    g.features.push({ 
      source: "background", 
      name: bg.feature.name,
      description: bg.feature.description 
    });
  }
  
  return g;
}

export function needsFromBackground(bg: SrdBackground): Partial<ChoiceNeeds> {
  const needs: Partial<ChoiceNeeds> = {};
  
  if (typeof bg.skill_proficiencies === 'object' && !Array.isArray(bg.skill_proficiencies)) {
    const sp = bg.skill_proficiencies as { choose?: number; from?: string[] };
    if (sp.choose && sp.from) {
      needs.skill = { required: sp.choose, from: sp.from };
    }
  }
  
  if (typeof bg.tool_proficiencies === 'object' && !Array.isArray(bg.tool_proficiencies)) {
    const tp = bg.tool_proficiencies as { choose?: number; from?: string[] };
    if (tp.choose && tp.from) {
      needs.tool = { required: tp.choose, from: tp.from };
    }
  }
  
  if (typeof bg.languages === 'object' && !Array.isArray(bg.languages)) {
    const lg = bg.languages as { choose?: number; from?: string[] };
    if (lg.choose && lg.from) {
      needs.language = { required: lg.choose, from: lg.from };
    }
  }
  
  return needs;
}

export function grantsFromSubclass(sc: SrdSubclass, level: number): Grants {
  const g = emptyGrants();
  
  (sc.features || []).forEach(f => {
    if ((f.level || 1) <= level) {
      g.features.push({ 
        source: "subclass", 
        name: f.name, 
        level: f.level,
        description: f.description 
      });
    }
  });
  
  return g;
}

// === SPELLS ===
export function spellNeedsFor(
  cls: SrdClass, 
  level: number, 
  classIdentifier: string, 
  allClassSpells: SrdSpell[]
): Partial<ChoiceNeeds> {
  if (!cls.spellcasting_progression) {
    return {};
  }
  
  const { known, prepared } = spellKnownPrepared(cls, level, classIdentifier);
  
  return {
    spells: {
      mustKnow: known || 0,
      canPrepare: prepared || 0,
      list: allClassSpells,
    }
  };
}

// === LEGAL FILTERS ===
export function computeLegalSkillPool(classFrom: string[], alreadyGranted: Set<string>): string[] {
  return classFrom.filter(skill => !alreadyGranted.has(skill));
}

export function remaining(required: number, alreadyChosen: string[]): number {
  return Math.max(0, required - (alreadyChosen?.length || 0));
}

export function mergeGrants(base: Grants, addition: Grants): Grants {
  return {
    savingThrows: new Set([...base.savingThrows, ...addition.savingThrows]),
    skillProficiencies: new Set([...base.skillProficiencies, ...addition.skillProficiencies]),
    toolProficiencies: new Set([...base.toolProficiencies, ...addition.toolProficiencies]),
    armorProficiencies: new Set([...base.armorProficiencies, ...addition.armorProficiencies]),
    weaponProficiencies: new Set([...base.weaponProficiencies, ...addition.weaponProficiencies]),
    languages: new Set([...base.languages, ...addition.languages]),
    features: [...base.features, ...addition.features],
    traits: [...base.traits, ...addition.traits],
    abilityBonuses: mergeAbilityBonuses(base.abilityBonuses, addition.abilityBonuses),
  };
}
