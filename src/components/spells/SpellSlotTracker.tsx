import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Circle, Disc, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SpellSlotTrackerProps {
  characterId: string;
  characterLevel: number;
  characterClass: string;
}

// Standard spell slot progression
const SPELL_SLOTS_BY_LEVEL: Record<string, number[]> = {
  "1": [2, 0, 0, 0, 0, 0, 0, 0, 0],
  "2": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "3": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "4": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "5": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "6": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "7": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "8": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "9": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "10": [4, 3, 3, 3, 2, 0, 0, 0, 0],
  "11": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "12": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "13": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "14": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "15": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "16": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "17": [4, 3, 3, 3, 2, 1, 1, 1, 1],
  "18": [4, 3, 3, 3, 3, 1, 1, 1, 1],
  "19": [4, 3, 3, 3, 3, 2, 1, 1, 1],
  "20": [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export const SpellSlotTracker = ({
  characterId,
  characterLevel,
  characterClass
}: SpellSlotTrackerProps) => {
  const [spellSlots, setSpellSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpellSlots();
  }, [characterId]);

  const loadSpellSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("character_spell_slots")
        .select("*")
        .eq("character_id", characterId)
        .order("spell_level");

      if (error) throw error;

      // Initialize slots if they don't exist
      if (!data || data.length === 0) {
        await initializeSpellSlots();
        await loadSpellSlots();
        return;
      }

      setSpellSlots(data);
    } catch (error) {
      console.error("Error loading spell slots:", error);
      toast.error("Failed to load spell slots");
    } finally {
      setLoading(false);
    }
  };

  const initializeSpellSlots = async () => {
    const maxSlots = SPELL_SLOTS_BY_LEVEL[characterLevel.toString()] || [];
    const slots = maxSlots
      .map((max, index) => ({
        character_id: characterId,
        spell_level: index + 1,
        max_slots: max,
        used_slots: 0
      }))
      .filter(slot => slot.max_slots > 0);

    const { error } = await supabase
      .from("character_spell_slots")
      .insert(slots);

    if (error) throw error;
  };

  const useSpellSlot = async (slotId: string, currentUsed: number, maxSlots: number) => {
    if (currentUsed >= maxSlots) return;

    const { error } = await supabase
      .from("character_spell_slots")
      .update({ used_slots: currentUsed + 1 })
      .eq("id", slotId);

    if (error) {
      toast.error("Failed to use spell slot");
      return;
    }

    loadSpellSlots();
  };

  const restoreSpellSlot = async (slotId: string, currentUsed: number) => {
    if (currentUsed <= 0) return;

    const { error } = await supabase
      .from("character_spell_slots")
      .update({ used_slots: currentUsed - 1 })
      .eq("id", slotId);

    if (error) {
      toast.error("Failed to restore spell slot");
      return;
    }

    loadSpellSlots();
  };

  const longRest = async () => {
    try {
      const { error } = await supabase.rpc("reset_spell_slots", {
        char_id: characterId
      });

      if (error) throw error;

      toast.success("Spell slots restored!");
      loadSpellSlots();
    } catch (error) {
      console.error("Error resetting spell slots:", error);
      toast.error("Failed to restore spell slots");
    }
  };

  if (loading) {
    return <div>Loading spell slots...</div>;
  }

  const totalUsed = spellSlots.reduce((sum, slot) => sum + slot.used_slots, 0);
  const totalMax = spellSlots.reduce((sum, slot) => sum + slot.max_slots + (slot.bonus_slots || 0), 0);
  const percentUsed = totalMax > 0 ? (totalUsed / totalMax) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Spell Slots</CardTitle>
          <Button size="sm" variant="outline" onClick={longRest}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Long Rest
          </Button>
        </div>
        <Progress value={100 - percentUsed} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {spellSlots.map((slot) => {
          const totalSlots = slot.max_slots + (slot.bonus_slots || 0);
          const available = totalSlots - slot.used_slots;

          return (
            <div key={slot.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Level {slot.spell_level}</span>
                  <Badge variant={available > 0 ? "default" : "secondary"}>
                    {available} / {totalSlots}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: totalSlots }).map((_, idx) => {
                  const isUsed = idx < slot.used_slots;
                  return (
                    <Button
                      key={idx}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        isUsed
                          ? restoreSpellSlot(slot.id, slot.used_slots)
                          : useSpellSlot(slot.id, slot.used_slots, totalSlots)
                      }
                    >
                      {isUsed ? (
                        <Circle className="h-4 w-4" />
                      ) : (
                        <Disc className="h-4 w-4 fill-primary" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {spellSlots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No spell slots available for this character
          </p>
        )}
      </CardContent>
    </Card>
  );
};
