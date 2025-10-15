import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { validateInput, DamageSchema, HealingSchema, InitiativeSchema } from "@/lib/validation";

export const useCombatActions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const applyDamage = async (
    characterId: string,
    amount: number,
    damageType: string,
    encounterId: string,
    currentRound: number,
    sourceName?: string,
    abilityName?: string
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

      const { data, error } = await supabase.functions.invoke('apply-damage', {
        body: validation.data,
      });

      if (error) throw error;

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
  };

  const applyHealing = async (
    characterId: string,
    amount: number,
    encounterId: string,
    currentRound: number,
    sourceName?: string,
    abilityName?: string
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

      const { data, error } = await supabase.functions.invoke('apply-healing', {
        body: validation.data,
      });

      if (error) throw error;

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
  };

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

  const advanceTurn = async (encounterId: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('advance-turn', {
        body: { encounterId },
      });

      if (error) throw error;

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
  };

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
