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
    currentRound: number
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
      });

      if (!validation.success) {
        toast({
          title: "Invalid input",
          description: validation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validation.data;

      const { data, error } = await supabase.functions.invoke('apply-damage', {
        body: validatedData,
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
    } finally {
      setIsLoading(false);
    }
  };

  const applyHealing = async (
    characterId: string,
    amount: number,
    encounterId: string,
    currentRound: number
  ) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const validation = validateInput(HealingSchema, {
        characterId,
        amount,
        encounterId,
        currentRound,
      });

      if (!validation.success) {
        toast({
          title: "Invalid input",
          description: validation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validation.data;

      const { data, error } = await supabase.functions.invoke('apply-healing', {
        body: validatedData,
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
        toast({
          title: "Invalid input",
          description: validation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validation.data;

      const { data, error } = await supabase.functions.invoke('roll-initiative', {
        body: validatedData,
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
