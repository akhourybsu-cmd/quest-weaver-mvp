import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Combat action validation schemas
export const DamageSchema = z.object({
  characterId: z.string().uuid(),
  amount: z.number().int().min(0).max(1000),
  damageType: z.enum([
    "acid", "bludgeoning", "cold", "fire", "force", 
    "lightning", "necrotic", "piercing", "poison", 
    "psychic", "radiant", "slashing", "thunder"
  ]),
  encounterId: z.string().uuid(),
  currentRound: z.number().int().min(0),
  sourceName: z.string().optional(),
  abilityName: z.string().optional(),
});

export const HealingSchema = z.object({
  characterId: z.string().uuid(),
  amount: z.number().int().min(0).max(1000),
  encounterId: z.string().uuid(),
  currentRound: z.number().int().min(0),
  sourceName: z.string().optional(),
  abilityName: z.string().optional(),
});

export const InitiativeSchema = z.object({
  encounterId: z.string().uuid(),
  characterIds: z.array(z.string().uuid()).min(1).max(20),
});

export const SavePromptSchema = z.object({
  encounterId: z.string().uuid(),
  ability: z.enum(["STR", "DEX", "CON", "INT", "WIS", "CHA"]),
  dc: z.number().int().min(5).max(30),
  description: z.string().min(1).max(500),
  targetScope: z.enum(["party", "all", "custom"]),
  customTargetIds: z.array(z.string().uuid()).optional(),
  advantageMode: z.enum(["normal", "advantage", "disadvantage"]),
  halfOnSuccess: z.boolean(),
  expiresAt: z.string().optional(),
});

export const EffectSchema = z.object({
  encounter_id: z.string().uuid(),
  character_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  start_round: z.number().int().min(0),
  end_round: z.number().int().min(0).optional(),
  requires_concentration: z.boolean(),
  concentrating_character_id: z.string().uuid().optional(),
  damage_per_tick: z.number().int().min(0).max(500).optional(),
  damage_type_per_tick: z.string().optional(),
  ticks_at: z.enum(["start", "end"]).optional(),
});

export const SaveResultSchema = z.object({
  savePromptId: z.string().uuid(),
  characterId: z.string().uuid(),
  roll: z.number().int().min(1).max(20),
  modifier: z.number().int().min(-10).max(20),
});

export const ConditionSchema = z.object({
  encounterId: z.string().uuid(),
  characterId: z.string().uuid(),
  condition: z.string().min(1),
  endsAtRound: z.number().int().min(0).nullable(),
});

export const AdvanceTurnSchema = z.object({
  encounterId: z.string().uuid(),
});

export const AddMonstersSchema = z.object({
  encounterId: z.string().uuid(),
  monsters: z.array(z.object({
    sourceType: z.enum(["catalog", "homebrew"]),
    monsterId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20).optional(),
    namePrefix: z.string().optional(),
  })).min(1).max(10),
});

export const UndoActionSchema = z.object({
  encounterId: z.string().uuid(),
  logEntryId: z.string().uuid(),
});

export const ManageEffectSchema = z.object({
  action: z.enum(["create", "delete"]),
  encounterId: z.string().uuid(),
  effectData: z.any().optional(),
  effectId: z.string().uuid().optional(),
});

// Helper to safely parse and validate
export function validateRequest<T>(
  schema: z.ZodSchema<T>, 
  data: unknown,
  corsHeaders: Record<string, string>
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const firstError = result.error.issues[0];
  return { 
    success: false, 
    response: new Response(
      JSON.stringify({ 
        error: 'Invalid request data',
        details: `${firstError.path.join('.')}: ${firstError.message}` 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  };
}
