import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCombatActions = () => {
  const { toast } = useToast();

  const applyDamage = async (
    characterId: string,
    amount: number,
    damageType: string,
    encounterId: string,
    currentRound: number
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('apply-damage', {
        body: {
          characterId,
          amount,
          damageType,
          encounterId,
          currentRound,
        },
      });

      if (error) throw error;

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
    }
  };

  const applyHealing = async (
    characterId: string,
    amount: number,
    encounterId: string,
    currentRound: number
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('apply-healing', {
        body: {
          characterId,
          amount,
          encounterId,
          currentRound,
        },
      });

      if (error) throw error;

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
    }
  };

  const rollInitiative = async (encounterId: string, characterIds: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('roll-initiative', {
        body: {
          encounterId,
          characterIds,
        },
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
    }
  };

  const advanceTurn = async (encounterId: string) => {
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
    }
  };

  const manageEffect = async (
    action: 'create' | 'delete',
    encounterId: string,
    effectData?: any,
    effectId?: string
  ) => {
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
    }
  };

  return {
    applyDamage,
    applyHealing,
    rollInitiative,
    advanceTurn,
    manageEffect,
  };
};
