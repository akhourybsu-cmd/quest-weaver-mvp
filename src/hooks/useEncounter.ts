import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InitiativeEntry {
  id: string;
  combatant_id: string;
  combatant_type: 'character' | 'monster';
  initiative_roll: number;
  is_current_turn: boolean;
  combatant_name?: string;
  combatant_stats?: {
    ac: number;
    hp_current: number;
    hp_max: number;
    resistances?: string[];
    vulnerabilities?: string[];
    immunities?: string[];
  };
}

export const useEncounter = (encounterId: string | null) => {
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (!encounterId) return;

    fetchInitiative();
    fetchEncounterData();

    // Subscribe to initiative changes
    const channel = supabase
      .channel('initiative-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchInitiative()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounterId}`,
        },
        () => fetchEncounterData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchInitiative = async () => {
    if (!encounterId) return;

    const { data, error } = await supabase
      .from("initiative")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("initiative_roll", { ascending: false })
      .order("dex_modifier", { ascending: false })
      .order("passive_perception", { ascending: false })
      .order("created_at", { ascending: true }); // Final stable tiebreaker

    if (error) {
      toast({
        title: "Error loading initiative",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch character and monster data separately
    const entries: InitiativeEntry[] = await Promise.all(
      (data || []).map(async (init): Promise<InitiativeEntry> => {
        if (init.combatant_type === 'character') {
          const { data: char } = await supabase
            .from('characters')
            .select('name, ac, current_hp, max_hp, resistances, vulnerabilities, immunities')
            .eq('id', init.combatant_id)
            .single();

          return {
            id: init.id,
            combatant_id: init.combatant_id,
            combatant_type: 'character',
            initiative_roll: init.initiative_roll,
            is_current_turn: init.is_current_turn,
            combatant_name: char?.name,
            combatant_stats: char ? {
              ac: char.ac,
              hp_current: char.current_hp,
              hp_max: char.max_hp,
              resistances: char.resistances || [],
              vulnerabilities: char.vulnerabilities || [],
              immunities: char.immunities || []
            } : undefined
          };
        } else {
          const { data: monster } = await supabase
            .from('encounter_monsters')
            .select('display_name, ac, hp_current, hp_max, resistances, vulnerabilities, immunities')
            .eq('id', init.combatant_id)
            .single();

          return {
            id: init.id,
            combatant_id: init.combatant_id,
            combatant_type: 'monster',
            initiative_roll: init.initiative_roll,
            is_current_turn: init.is_current_turn,
            combatant_name: monster?.display_name,
            combatant_stats: monster ? {
              ac: monster.ac,
              hp_current: monster.hp_current,
              hp_max: monster.hp_max,
              resistances: (monster.resistances as any) || [],
              vulnerabilities: (monster.vulnerabilities as any) || [],
              immunities: (monster.immunities as any) || []
            } : undefined
          };
        }
      })
    );

    setInitiative(entries);
  };

  const fetchEncounterData = async () => {
    if (!encounterId) return;

    const { data, error } = await supabase
      .from("encounters")
      .select("current_round")
      .eq("id", encounterId)
      .single();

    if (error) return;
    setCurrentRound(data.current_round);
  };

  const addToInitiative = async (characterId: string, roll: number) => {
    if (!encounterId) return;

    const { error } = await supabase
      .from("initiative")
      .insert({
        encounter_id: encounterId,
        character_id: characterId,
        initiative_roll: roll,
      });

    if (error) {
      toast({
        title: "Error adding to initiative",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Added to initiative",
      description: `Roll: ${roll}`,
    });
  };

  const nextTurn = async () => {
    if (!encounterId || initiative.length === 0) return;

    const currentIndex = initiative.findIndex(entry => entry.is_current_turn);
    
    // If no current turn (combat just starting), set first combatant as current
    if (currentIndex === -1) {
      await supabase
        .from("initiative")
        .update({ is_current_turn: true })
        .eq("id", initiative[0].id);
      
      return;
    }

    const nextIndex = (currentIndex + 1) % initiative.length;
    const isNewRound = nextIndex === 0;

    // Update current turn marker
    await supabase
      .from("initiative")
      .update({ is_current_turn: false })
      .eq("encounter_id", encounterId);

    await supabase
      .from("initiative")
      .update({ is_current_turn: true })
      .eq("id", initiative[nextIndex].id);

    // Increment round and log if needed
    if (isNewRound) {
      const newRound = currentRound + 1;
      const { error } = await supabase
        .from("encounters")
        .update({ current_round: newRound })
        .eq("id", encounterId);

      if (error) {
        toast({
          title: "Error updating round",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Log round transition
        await supabase.from('combat_log').insert({
          encounter_id: encounterId,
          round: newRound,
          action_type: 'round_start',
          message: `— Round ${newRound} begins —`,
        });
      }
    }
  };

  const previousTurn = async () => {
    if (!encounterId || initiative.length === 0) return;

    const currentIndex = initiative.findIndex(entry => entry.is_current_turn);
    
    // If no current turn, do nothing
    if (currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? initiative.length - 1 : currentIndex - 1;
    const isPreviousRound = currentIndex === 0;

    // Update current turn marker
    await supabase
      .from("initiative")
      .update({ is_current_turn: false })
      .eq("encounter_id", encounterId);

    await supabase
      .from("initiative")
      .update({ is_current_turn: true })
      .eq("id", initiative[prevIndex].id);

    // Decrement round if needed
    if (isPreviousRound && currentRound > 1) {
      const { error } = await supabase
        .from("encounters")
        .update({ current_round: currentRound - 1 })
        .eq("id", encounterId);

      if (error) {
        toast({
          title: "Error updating round",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const removeFromInitiative = async (initiativeId: string) => {
    const { error } = await supabase
      .from("initiative")
      .delete()
      .eq("id", initiativeId);

    if (error) {
      toast({
        title: "Error removing from initiative",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    initiative,
    currentRound,
    addToInitiative,
    nextTurn,
    previousTurn,
    removeFromInitiative,
  };
};
