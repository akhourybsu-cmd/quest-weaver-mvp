import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InitiativeEntry {
  id: string;
  character_id: string;
  initiative_roll: number;
  is_current_turn: boolean;
  character?: {
    name: string;
    ac: number;
    current_hp: number;
    max_hp: number;
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
      .select(`
        *,
        characters:character_id (
          name,
          ac,
          current_hp,
          max_hp
        )
      `)
      .eq("encounter_id", encounterId)
      .order("initiative_roll", { ascending: false });

    if (error) {
      toast({
        title: "Error loading initiative",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setInitiative(data || []);
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

    // Increment round if needed
    if (isNewRound) {
      const { error } = await supabase
        .from("encounters")
        .update({ current_round: currentRound + 1 })
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
    removeFromInitiative,
  };
};
