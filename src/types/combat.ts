/**
 * Shared Combat Types
 * Strict typing for all combat-related data structures
 */

// ============= ENUMS & CONSTANTS =============

export type CombatantType = 'character' | 'monster';

export type DamageType = 
  | 'acid' 
  | 'bludgeoning' 
  | 'cold' 
  | 'fire' 
  | 'force'
  | 'lightning' 
  | 'necrotic' 
  | 'piercing' 
  | 'poison'
  | 'psychic' 
  | 'radiant' 
  | 'slashing' 
  | 'thunder';

export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export type EffectTickTiming = 'start' | 'end';

export type TargetScope = 'party' | 'all' | 'custom';

export type SavePromptStatus = 'active' | 'resolved' | 'expired';

export type MonsterSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

export type ConditionType = 
  | 'blinded' 
  | 'charmed' 
  | 'deafened' 
  | 'frightened'
  | 'grappled' 
  | 'incapacitated' 
  | 'invisible' 
  | 'paralyzed'
  | 'petrified' 
  | 'poisoned' 
  | 'prone' 
  | 'restrained'
  | 'stunned' 
  | 'unconscious' 
  | 'exhaustion';

// ============= CHARACTER TYPES =============

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  initiative_bonus: number;
  passive_perception: number;
  speed: number;
  proficiency_bonus: number;
  
  // Saves
  str_save: number;
  dex_save: number;
  con_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
  
  // Damage modifiers
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
  
  // Metadata
  user_id: string;
  campaign_id: string;
  created_at: string;
  updated_at: string;
}

// ============= MONSTER TYPES =============

export interface MonsterAbilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterAction {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage_dice?: string;
  damage_bonus?: number;
}

export interface MonsterTrait {
  name: string;
  desc: string;
}

export interface EncounterMonster {
  id: string;
  encounter_id: string;
  source_monster_id: string;
  source_type: 'catalog' | 'homebrew';
  
  // Display
  name: string;
  display_name: string;
  group_key: string;
  
  // Stats
  size: MonsterSize;
  type: string;
  ac: number;
  hp_current: number;
  hp_max: number;
  speed: Record<string, unknown>;
  abilities: MonsterAbilities;
  
  // Combat
  initiative: number;
  initiative_bonus: number;
  is_current_turn: boolean;
  order_tiebreak: number;
  
  // Abilities
  saves: Record<string, number>;
  skills: Record<string, number>;
  senses: Record<string, unknown>;
  resistances: unknown[];
  vulnerabilities: unknown[];
  immunities: unknown[];
  
  // Features
  traits: MonsterTrait[];
  actions: MonsterAction[];
  reactions: unknown[];
  legendary_actions: unknown[];
  languages: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============= INITIATIVE TYPES =============

export interface InitiativeEntry {
  id: string;
  encounter_id: string;
  combatant_id: string;
  combatant_type: CombatantType;
  initiative_roll: number;
  dex_modifier: number;
  passive_perception: number;
  is_current_turn: boolean;
  created_at: string;
  
  // Enriched data (not from DB)
  combatant_name?: string;
  combatant_stats?: {
    ac: number;
    hp_current: number;
    hp_max: number;
  };
}

// ============= ENCOUNTER TYPES =============

export interface Encounter {
  id: string;
  campaign_id: string;
  name: string | null;
  current_round: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============= EFFECT TYPES =============

export interface Effect {
  id: string;
  encounter_id: string;
  character_id: string | null;
  name: string;
  description: string | null;
  notes: string | null;
  source: string | null;
  
  // Duration
  start_round: number;
  end_round: number | null;
  
  // Damage
  damage_per_tick: number | null;
  damage_type_per_tick: DamageType | null;
  ticks_at: EffectTickTiming | null;
  
  // Concentration
  requires_concentration: boolean;
  concentrating_character_id: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============= CONDITION TYPES =============

export interface CharacterCondition {
  id: string;
  encounter_id: string;
  character_id: string;
  condition: ConditionType;
  ends_at_round: number | null;
  source_effect_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============= SAVE PROMPT TYPES =============

export interface SavePrompt {
  id: string;
  encounter_id: string;
  ability: AbilityScore;
  dc: number;
  description: string;
  target_scope: TargetScope;
  target_character_ids: string[] | null;
  advantage_mode: AdvantageMode;
  half_on_success: boolean;
  expected_responses: number | null;
  received_responses: number;
  status: SavePromptStatus;
  expires_at: string | null;
  created_at: string;
}

export interface SaveResult {
  id: string;
  save_prompt_id: string;
  character_id: string;
  roll: number;
  modifier: number;
  total: number;
  success: boolean;
  created_at: string;
}

// ============= COMBAT LOG TYPES =============

export interface CombatLogEntry {
  id: string;
  encounter_id: string;
  character_id: string | null;
  round: number;
  action_type: 'damage' | 'healing' | 'save' | 'effect_applied' | 'effect_expired' | 'round_start';
  message: string;
  amount: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ============= DAMAGE CALCULATION TYPES =============

export interface DamageStep {
  description: string;
  amount?: number;
}

export interface DamageResult {
  finalDamage: number;
  newHP: number;
  newTempHP: number;
  damageSteps: string[];
  concentrationCheck?: {
    required: boolean;
    dc?: number;
    effects?: Array<{ id: string; name: string }>;
  };
}

export interface HealingResult {
  newHP: number;
  actualHealing: number;
}

// ============= COMBAT ACTION PAYLOADS =============

export interface ApplyDamagePayload {
  characterId: string;
  amount: number;
  damageType: DamageType;
  encounterId: string;
  currentRound: number;
  sourceName?: string;
  abilityName?: string;
}

export interface ApplyHealingPayload {
  characterId: string;
  amount: number;
  encounterId: string;
  currentRound: number;
  sourceName?: string;
  abilityName?: string;
}

export interface CreateSavePromptPayload {
  encounterId: string;
  ability: AbilityScore;
  dc: number;
  description: string;
  targetScope: TargetScope;
  advantageMode: AdvantageMode;
  halfOnSuccess: boolean;
  targetCharacterIds?: string[];
}

export interface RecordSaveResultPayload {
  savePromptId: string;
  characterId: string;
  roll: number;
  modifier: number;
}

// ============= COMPONENT PROPS TYPES =============

export interface CombatComponentProps {
  encounterId: string;
  currentRound: number;
}

export interface CharacterListItemProps {
  character: Character;
  isCurrentTurn: boolean;
  onApplyDamage: (amount: number, damageType: DamageType, source?: string, ability?: string) => void;
  onApplyHealing: (amount: number, source?: string, ability?: string) => void;
}

export interface MonsterCardProps {
  monster: EncounterMonster;
  isCurrentTurn: boolean;
  onApplyDamage: (amount: number, damageType: DamageType, source?: string, ability?: string) => void;
  onRemove: () => void;
}

// ============= UTILITY TYPES =============

export interface AbilityScoreSet {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface SaveModifiers {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

// ============= HELPER TYPE GUARDS =============

export function isDamageType(value: string): value is DamageType {
  const validTypes: DamageType[] = [
    'acid', 'bludgeoning', 'cold', 'fire', 'force',
    'lightning', 'necrotic', 'piercing', 'poison',
    'psychic', 'radiant', 'slashing', 'thunder'
  ];
  return validTypes.includes(value as DamageType);
}

export function isAbilityScore(value: string): value is AbilityScore {
  return ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(value);
}

export function isConditionType(value: string): value is ConditionType {
  const validConditions: ConditionType[] = [
    'blinded', 'charmed', 'deafened', 'frightened',
    'grappled', 'incapacitated', 'invisible', 'paralyzed',
    'petrified', 'poisoned', 'prone', 'restrained',
    'stunned', 'unconscious', 'exhaustion'
  ];
  return validConditions.includes(value as ConditionType);
}
