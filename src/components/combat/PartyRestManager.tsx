import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PartyRestManagerProps {
  campaignId: string;
  characters: Array<{ id: string; name: string }>;
  onUpdate?: () => void;
}

export function PartyRestManager({ campaignId, characters, onUpdate }: PartyRestManagerProps) {
  const { toast } = useToast();
  const [isResting, setIsResting] = useState(false);

  const handlePartyLongRest = async () => {
    setIsResting(true);

    try {
      for (const char of characters) {
        // Get character data
        const { data: charData } = await supabase
          .from("characters")
          .select("max_hp, hit_dice_total, hit_dice_current")
          .eq("id", char.id)
          .single();

        if (!charData) continue;

        // Restore hit dice (half total, minimum 1)
        const hdRestored = Math.max(1, Math.floor((charData.hit_dice_total || 1) / 2));
        const newHitDice = Math.min(
          (charData.hit_dice_current || 0) + hdRestored,
          charData.hit_dice_total || 1
        );

        // Update character core stats
        await supabase
          .from("characters")
          .update({
            current_hp: charData.max_hp,
            temp_hp: 0,
            death_save_success: 0,
            death_save_fail: 0,
            hit_dice_current: newHitDice,
            action_used: false,
            bonus_action_used: false,
            reaction_used: false,
            pact_slots_used: 0,
            mystic_arcanum_6_used: false,
            mystic_arcanum_7_used: false,
            mystic_arcanum_8_used: false,
            mystic_arcanum_9_used: false,
          })
          .eq("id", char.id);

        // Restore all character_resources (short + long recharge)
        await supabase
          .from("character_resources")
          .update({ current_value: supabase.rpc ? 0 : 0 }) // placeholder
          .eq("character_id", char.id);

        // Actually restore resources to max by fetching then updating
        const { data: resources } = await supabase
          .from("character_resources")
          .select("id, max_value")
          .eq("character_id", char.id)
          .in("recharge", ["short", "long"]);

        if (resources) {
          for (const r of resources) {
            await supabase
              .from("character_resources")
              .update({ current_value: r.max_value })
              .eq("id", r.id);
          }
        }

        // Reset spell slots
        await supabase
          .from("character_spell_slots")
          .update({ used_slots: 0 })
          .eq("character_id", char.id);
      }

      // Clear any active effects and conditions for the campaign
      const { data: activeEncounters } = await supabase
        .from("encounters")
        .select("id")
        .eq("campaign_id", campaignId)
        .in("status", ["active", "paused"]);

      if (activeEncounters && activeEncounters.length > 0) {
        for (const encounter of activeEncounters) {
          await supabase
            .from("effects")
            .delete()
            .eq("encounter_id", encounter.id);

          await supabase
            .from("character_conditions")
            .delete()
            .eq("encounter_id", encounter.id);
        }
      }

      toast({
        title: "Party Long Rest Complete",
        description: `${characters.length} character${characters.length !== 1 ? 's' : ''} fully restored. All effects and conditions cleared.`,
        duration: 5000,
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete long rest",
        variant: "destructive",
      });
    } finally {
      setIsResting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Party Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={characters.length === 0}>
              <Moon className="w-4 h-4 mr-2" />
              Long Rest (Entire Party)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Party Long Rest</AlertDialogTitle>
              <AlertDialogDescription>
                This will fully restore all {characters.length} party member{characters.length !== 1 ? 's' : ''}:
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Full HP restoration</li>
                  <li>• Hit dice recovery (half total)</li>
                  <li>• All resources recharged</li>
                  <li>• All spell slots restored</li>
                  <li>• Death saves cleared</li>
                  <li>• Action economy reset</li>
                  <li>• All effects & conditions removed</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePartyLongRest} disabled={isResting}>
                {isResting ? "Resting..." : "Take Long Rest"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
