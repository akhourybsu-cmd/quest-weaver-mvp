import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { validateInput, DamageSchema, HealingSchema, InitiativeSchema } from "@/lib/validation";
import { withRetry } from "@/lib/retryHelper";
import { trackCombatAction } from "@/lib/telemetry";

// Generate idempotency key for combat actions
function generateIdempotencyKey(action: string, targetId: string): string {
  return `${action}:${targetId}:${Date.now()}`;
}

export const useCombatActions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const applyDamage = useCallback(async (
    characterId: string,
    amount: number,
    damageType: string,
    encounterId: string,
    currentRound: number,
    sourceName?: string,
    abilityName?: string,
    onOptimisticUpdate?: (newHP: number) => void
  ) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Validate input
      const validation = validateInput(DamageSchema, {
        characterId,
        amount,
        damageType,
        encounterId,
        currentRound,
        sourceName,
        abilityName,
      });

      if (!validation.success) {
        const errorMsg = (validation as { success: false; error: string }).error;
        toast({
          title: "Invalid input",
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Execute with retry logic, idempotency, and telemetry
      const { data, error } = await trackCombatAction(
        "damage_applied",
        () => withRetry(
          () => supabase.functions.invoke('apply-damage', {
            body: validation.data,
            headers: {
              'Idempotency-Key': generateIdempotencyKey('damage', characterId),
            },
          }),
          {
            maxRetries: 2,
            onRetry: (attempt, err) => {
              console.log(`Retrying damage application (attempt ${attempt}):`, err);
              toast({
                title: "Retrying...",
                description: `Network issue detected, retrying (${attempt}/2)`,
              });
            },
          }
        ),
        {
          encounterId,
          eventData: { characterId, amount, damageType, sourceName, abilityName },
        }
      );

      if (error) throw error;

      // Apply optimistic update if callback provided
      if (onOptimisticUpdate && data?.newHP !== undefined) {
        onOptimisticUpdate(data.newHP);
      }

      // Auto-create concentration save prompt if needed
      if (data?.concentrationCheck?.required) {
        const dc = data.concentrationCheck.dc;
        const effects = data.concentrationCheck.effects;
        const effectNames = effects.map((e: any) => e.name).join(", ");
        
        await supabase.from("save_prompts").insert({
          encounter_id: encounterId,
          ability: "CON",
          dc: dc,
          description: `Concentration check (${effectNames}) — DC ${dc}`,
          target_scope: "custom",
          target_character_ids: [characterId],
          advantage_mode: "normal",
          half_on_success: false,
          expected_responses: 1,
        });
      }

      toast({
        title: "Damage applied",
        description: data.damageSteps?.join(" → "),
      });

      return data;
    } catch (error) {
      console.error("Error applying damage:", error);
      toast({
        title: "Error applying damage",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, toast]);

  const applyHealing = useCallback(async (
    characterId: string,
    amount: number,
    encounterId: string,
    currentRound: number,
    sourceName?: string,
    abilityName?: string,
    onOptimisticUpdate?: (newHP: number) => void
  ) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const validation = validateInput(HealingSchema, {
        characterId,
        amount,
        encounterId,
        currentRound,
        sourceName,
        abilityName,
      });

      if (!validation.success) {
        const errorMsg = (validation as { success: false; error: string }).error;
        toast({
          title: "Invalid input",
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Execute with retry logic, idempotency, and telemetry
      const { data, error } = await trackCombatAction(
        "healing_applied",
        () => withRetry(
          () => supabase.functions.invoke('apply-healing', {
            body: validation.data,
            headers: {
              'Idempotency-Key': generateIdempotencyKey('healing', characterId),
            },
          }),
          {
            maxRetries: 2,
            onRetry: (attempt, err) => {
              console.log(`Retrying heal application (attempt ${attempt}):`, err);
              toast({
                title: "Retrying...",
                description: `Network issue detected, retrying (${attempt}/2)`,
              });
            },
          }
        ),
        {
          encounterId,
          eventData: { characterId, amount, sourceName, abilityName },
        }
      );

      if (error) throw error;

      // Apply optimistic update if callback provided
      if (onOptimisticUpdate && data?.newHP !== undefined) {
        onOptimisticUpdate(data.newHP);
      }

      // Clear death saves on healing
      if (data?.newHP > 0) {
        await supabase
          .from("characters")
          .update({ 
            death_save_success: 0,
            death_save_fail: 0
          })
          .eq("id", characterId);
      }

      toast({
        title: "Healing applied",
        description: `Healed for ${data.actualHealing} HP`,
      });

      return data;
    } catch (error) {
      console.error("Error applying healing:", error);
      toast({
        title: "Error applying healing",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, toast]);

  const rollInitiative = async (encounterId: string, characterIds: string[]) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const validation = validateInput(InitiativeSchema, {
        encounterId,
        characterIds,
      });

      if (!validation.success) {
        const errorMsg = (validation as { success: false; error: string }).error;
        toast({
          title: "Invalid input",
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('roll-initiative', {
        body: validation.data,
      });

      if (error) throw error;

      toast({
        title: "Initiative rolled",
        description: `${characterIds.length} combatants ready`,
      });

      return data;
    } catch (error) {
      console.error("Error rolling initiative:", error);
      toast({
        title: "Error rolling initiative",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const advanceTurn = useCallback(async (encounterId: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await trackCombatAction(
        "turn_advance",
        () => withRetry(
          () => supabase.functions.invoke('advance-turn', {
            body: { encounterId },
          }),
          {
            maxRetries: 2,
            onRetry: (attempt) => {
              console.log(`Retrying turn advance (attempt ${attempt})`);
            },
          }
        ),
        { encounterId, eventData: {} }
      );

      if (error) throw error;

      // Track new round if applicable
      if (data.isNewRound) {
        await supabase.from("analytics_events").insert({
          encounter_id: encounterId,
          event_type: "round_start",
          event_data: { round: data.newRound },
        });
      }

      toast({
        title: data.isNewRound ? `Round ${data.newRound}` : "Turn advanced",
        description: `${data.currentTurn}'s turn`,
      });

      return data;
    } catch (error) {
      console.error("Error advancing turn:", error);
      toast({
        title: "Error advancing turn",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, toast]);

  const manageEffect = async (
    action: 'create' | 'delete',
    encounterId: string,
    effectData?: any,
    effectId?: string
  ) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-effect', {
        body: {
          action,
          encounterId,
          effectData,
          effectId,
        },
      });

      if (error) throw error;

      toast({
        title: action === 'create' ? "Effect added" : "Effect removed",
      });

      return data;
    } catch (error) {
      console.error("Error managing effect:", error);
      toast({
        title: "Error managing effect",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    applyDamage,
    applyHealing,
    rollInitiative,
    advanceTurn,
    manageEffect,
    isLoading,
  };
};
