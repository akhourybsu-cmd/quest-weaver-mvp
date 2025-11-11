/**
 * D&D 5E Rules Engine
 * Applies feature rules to characters
 */

import { supabase } from "@/integrations/supabase/client";

// ==================== TYPES ====================

export interface RulesJSON {
  grantProficiency?: {
    skills?: string[];
    tools?: string[];
    weapons?: string[];
    armor?: string[];
    saves?: string[];
    languages?: string[];
  };
  grantResource?: {
    key: string;
    label: string;
    maxFormula: string;
    recharge: 'short' | 'long' | 'daily' | 'never' | 'manual';
    metadata?: Record<string, any>;
  };
  grantChoice?: {
    key: string;
    count: number;
    options: string[];
    category: 'skill' | 'tool' | 'language' | 'fighting_style' | 'expertise' | 'metamagic' | 'invocation' | 'maneuver';
  };
  grantSpell?: {
    spellId: string;
    spellType: 'srd' | 'custom';
    alwaysPrepared: boolean;
  };
  grantEffect?: {
    on: 'self' | 'target';
    mods: Record<string, any>;
    tags: string[];
    expires: 'toggle' | 'round' | 'manual';
  };
  grantAbilityBonus?: {
    [ability: string]: number;
  };
  asi?: boolean; // Ability Score Improvement flag
}

export interface ChoicesJSON {
  [key: string]: {
    type: 'skill' | 'tool' | 'language' | 'fighting_style' | 'expertise' | 'metamagic' | 'invocation' | 'spell' | 'maneuver';
    count: number;
    options: string[];
    restrictions?: Record<string, any>;
  };
}

export interface FeatureApplication {
  characterId: string;
  featureId: string;
  featureType: 'class' | 'subclass' | 'feat';
  rules: RulesJSON;
  choices?: ChoicesJSON;
  level: number;
}

// ==================== RULES ENGINE ====================

/**
 * Apply a feature's rules to a character
 */
export async function applyFeature(application: FeatureApplication): Promise<{
  success: boolean;
  changes: string[];
  errors: string[];
}> {
  const { characterId, featureId, featureType, rules, level } = application;
  const changes: string[] = [];
  const errors: string[] = [];

  try {
    // Grant Proficiencies
    if (rules.grantProficiency) {
      const prof = rules.grantProficiency;
      
      for (const skill of prof.skills || []) {
        const { error } = await supabase
          .from('character_proficiencies')
          .insert({
            character_id: characterId,
            type: 'skill',
            name: skill
          });
        
        if (!error) changes.push(`Gained ${skill} proficiency`);
        else errors.push(`Failed to add ${skill}: ${error.message}`);
      }
      
      for (const tool of prof.tools || []) {
        const { error } = await supabase
          .from('character_proficiencies')
          .insert({
            character_id: characterId,
            type: 'tool',
            name: tool
          });
        
        if (!error) changes.push(`Gained ${tool} proficiency`);
        else errors.push(`Failed to add ${tool}: ${error.message}`);
      }
      
      for (const weapon of prof.weapons || []) {
        const { error } = await supabase
          .from('character_proficiencies')
          .insert({
            character_id: characterId,
            type: 'weapon',
            name: weapon
          });
        
        if (!error) changes.push(`Gained ${weapon} proficiency`);
        else errors.push(`Failed to add ${weapon}: ${error.message}`);
      }
      
      for (const armor of prof.armor || []) {
        const { error } = await supabase
          .from('character_proficiencies')
          .insert({
            character_id: characterId,
            type: 'armor',
            name: armor
          });
        
        if (!error) changes.push(`Gained ${armor} proficiency`);
        else errors.push(`Failed to add ${armor}: ${error.message}`);
      }

      for (const lang of prof.languages || []) {
        const { error } = await supabase
          .from('character_proficiencies')
          .insert({
            character_id: characterId,
            type: 'language',
            name: lang
          });
        
        if (!error) changes.push(`Learned ${lang}`);
        else errors.push(`Failed to add ${lang}: ${error.message}`);
      }
    }

    // Grant Resource
    if (rules.grantResource) {
      const res = rules.grantResource;
      const maxValue = evaluateFormula(res.maxFormula, level);
      
      // Check if resource already exists (for upgrades)
      const { data: existing } = await supabase
        .from('character_resources')
        .select('id')
        .eq('character_id', characterId)
        .eq('resource_key', res.key)
        .single();

      if (existing) {
        // Update existing resource
        const { error } = await supabase
          .from('character_resources')
          .update({
            max_value: maxValue,
            current_value: maxValue,
            max_formula: res.maxFormula,
            metadata_json: res.metadata || {}
          })
          .eq('id', existing.id);
        
        if (!error) changes.push(`Upgraded ${res.label} to ${maxValue}`);
        else errors.push(`Failed to upgrade resource: ${error.message}`);
      } else {
        // Create new resource
        const { error } = await supabase
          .from('character_resources')
          .insert({
            character_id: characterId,
            resource_key: res.key,
            label: res.label,
            max_value: maxValue,
            current_value: maxValue,
            max_formula: res.maxFormula,
            recharge: res.recharge,
            metadata_json: res.metadata || {}
          });
        
        if (!error) changes.push(`Gained ${res.label} (${maxValue})`);
        else errors.push(`Failed to add resource: ${error.message}`);
      }
    }

    // Grant Spell
    if (rules.grantSpell) {
      const spell = rules.grantSpell;
      
      const { error } = await supabase
        .from('character_spells_known')
        .insert({
          character_id: characterId,
          spell_id: spell.spellId,
          spell_type: spell.spellType,
          learned_at_level: level,
          source: featureType === 'feat' ? 'feat' : featureType,
          is_always_prepared: spell.alwaysPrepared,
          is_prepared: spell.alwaysPrepared
        });
      
      if (!error) changes.push(`Learned spell`);
      else errors.push(`Failed to add spell: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      changes,
      errors
    };
  } catch (error) {
    return {
      success: false,
      changes,
      errors: [`Unexpected error: ${error}`]
    };
  }
}

/**
 * Evaluate a formula string (e.g., "level", "floor((level+1)/2)")
 * Very basic implementation - can be enhanced
 */
function evaluateFormula(formula: string, level: number): number {
  try {
    // Replace 'level' with actual value
    const expr = formula.replace(/level/g, level.toString());
    
    // Handle floor function
    if (expr.includes('floor')) {
      const match = expr.match(/floor\((.*?)\)/);
      if (match) {
        const inner = match[1];
        const result = eval(inner);
        return Math.floor(result);
      }
    }
    
    // Simple evaluation
    return eval(expr);
  } catch {
    return 0;
  }
}

/**
 * Get features for a character level
 */
export async function getFeaturesForLevel(
  classId: string,
  level: number,
  subclassId?: string
): Promise<{
  classFeatures: any[];
  subclassFeatures: any[];
}> {
  const { data: classFeatures = [], error: cfError } = await supabase
    .from('class_features')
    .select('*')
    .eq('class_id', classId)
    .eq('level', level);

  if (cfError) console.error('Error loading class features:', cfError);

  let subclassFeatures: any[] = [];
  if (subclassId) {
    const { data, error: sfError } = await supabase
      .from('subclass_features')
      .select('*')
      .eq('subclass_id', subclassId)
      .eq('level', level);

    if (sfError) console.error('Error loading subclass features:', sfError);
    subclassFeatures = data || [];
  }

  return { classFeatures, subclassFeatures };
}

/**
 * Apply all level-up features to a character
 */
export async function applyLevelUpFeatures(
  characterId: string,
  classId: string,
  newLevel: number,
  subclassId?: string
): Promise<{
  success: boolean;
  allChanges: string[];
  allErrors: string[];
}> {
  const allChanges: string[] = [];
  const allErrors: string[] = [];

  const { classFeatures, subclassFeatures } = await getFeaturesForLevel(
    classId,
    newLevel,
    subclassId
  );

  // Apply class features
  for (const feature of classFeatures) {
    const result = await applyFeature({
      characterId,
      featureId: feature.id,
      featureType: 'class',
      rules: feature.rules_json,
      choices: feature.choices_json,
      level: newLevel
    });
    
    allChanges.push(...result.changes);
    allErrors.push(...result.errors);
  }

  // Apply subclass features
  for (const feature of subclassFeatures) {
    const result = await applyFeature({
      characterId,
      featureId: feature.id,
      featureType: 'subclass',
      rules: feature.rules_json,
      choices: feature.choices_json,
      level: newLevel
    });
    
    allChanges.push(...result.changes);
    allErrors.push(...result.errors);
  }

  return {
    success: allErrors.length === 0,
    allChanges,
    allErrors
  };
}

/**
 * Restore resources on rest
 */
export async function restoreResourcesOnRest(
  characterId: string,
  restType: 'short' | 'long'
): Promise<void> {
  // Get all resources
  const { data: resources } = await supabase
    .from('character_resources')
    .select('*')
    .eq('character_id', characterId);

  if (!resources) return;

  // Update resources that recharge on this rest type
  for (const resource of resources) {
    const shouldRestore = 
      (restType === 'long' && (resource.recharge === 'long' || resource.recharge === 'short')) ||
      (restType === 'short' && resource.recharge === 'short');

    if (shouldRestore) {
      await supabase
        .from('character_resources')
        .update({ current_value: resource.max_value })
        .eq('id', resource.id);
    }
  }
}
