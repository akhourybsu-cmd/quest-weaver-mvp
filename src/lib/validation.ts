import { z } from "zod";

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
});

export const HealingSchema = z.object({
  characterId: z.string().uuid(),
  amount: z.number().int().min(0).max(1000),
  encounterId: z.string().uuid(),
  currentRound: z.number().int().min(0),
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
  advantageMode: z.enum(["normal", "advantage", "disadvantage"]),
  halfOnSuccess: z.boolean(),
});

export const EffectSchema = z.object({
  encounterId: z.string().uuid(),
  characterId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startRound: z.number().int().min(0),
  endRound: z.number().int().min(0).optional(),
  requiresConcentration: z.boolean(),
  concentratingCharacterId: z.string().uuid().optional(),
  damagePerTick: z.number().int().min(0).max(500).optional(),
  damageType: z.string().optional(),
  ticksAt: z.enum(["start", "end"]).optional(),
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

// Helper to safely parse and validate
export function validateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const firstError = result.error.issues[0];
    return { 
      success: false, 
      error: `${firstError.path.join('.')}: ${firstError.message}` 
    };
  }
}

