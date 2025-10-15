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
}

export function PartyRestManager({ campaignId, characters }: PartyRestManagerProps) {
  const { toast } = useToast();
  const [isResting, setIsResting] = useState(false);

  const handlePartyLongRest = async () => {
    setIsResting(true);

    try {
      // For each character, restore them fully
      for (const char of characters) {
        // Get character data including resources
        const { data: charData } = await supabase
          .from("characters")
          .select("max_hp, resources")
          .eq("id", char.id)
          .single();

        if (!charData) continue;

        // Restore all resources to max
        const currentResources = (charData.resources as any) || {};
        const restoredResources = { ...currentResources };

        Object.keys(restoredResources).forEach(key => {
          if (restoredResources[key]?.max !== undefined) {
            restoredResources[key].current = restoredResources[key].max;
          }
        });

        // Update character
        await supabase
          .from("characters")
          .update({
            current_hp: charData.max_hp,
            temp_hp: 0,
            death_save_success: 0,
            death_save_fail: 0,
            resources: restoredResources as any,
            action_used: false,
            bonus_action_used: false,
            reaction_used: false,
          })
          .eq("id", char.id);
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
                  <li>• All resources recharged</li>
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
