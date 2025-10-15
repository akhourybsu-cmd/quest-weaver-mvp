import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Heart, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeathSaveTrackerProps {
  characterId: string;
  characterName: string;
  successes: number;
  failures: number;
  currentHp: number;
  encounterId: string;
}

const DeathSaveTracker = ({
  characterId,
  characterName,
  successes,
  failures,
  currentHp,
  encounterId,
}: DeathSaveTrackerProps) => {
  const { toast } = useToast();
  const [rolling, setRolling] = useState(false);

  // Only show if character is at 0 HP
  if (currentHp > 0) return null;

  const rollDeathSave = async () => {
    setRolling(true);
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    let newSuccesses = successes;
    let newFailures = failures;
    let stabilized = false;

    if (d20 === 20) {
      // Natural 20: regain 1 HP
      await supabase
        .from("characters")
        .update({ 
          current_hp: 1,
          death_save_success: 0,
          death_save_fail: 0
        })
        .eq("id", characterId);
      
      toast({
        title: `${characterName} - Natural 20!`,
        description: "Regains 1 HP and stabilizes!",
      });
    } else if (d20 === 1) {
      // Natural 1: 2 failures
      newFailures = Math.min(failures + 2, 3);
      
      if (newFailures >= 3) {
        toast({
          title: `${characterName} - Critical Failure`,
          description: "Has died! 💀",
          variant: "destructive",
        });
      }
      
      await supabase
        .from("characters")
        .update({ death_save_fail: newFailures })
        .eq("id", characterId);
    } else if (d20 >= 10) {
      // Success
      newSuccesses = Math.min(successes + 1, 3);
      
      if (newSuccesses >= 3) {
        stabilized = true;
        toast({
          title: `${characterName} - Stabilized`,
          description: "Three death save successes! Character is stable.",
        });
      }
      
      await supabase
        .from("characters")
        .update({ death_save_success: newSuccesses })
        .eq("id", characterId);
    } else {
      // Failure
      newFailures = Math.min(failures + 1, 3);
      
      if (newFailures >= 3) {
        toast({
          title: `${characterName} - Death`,
          description: "Three failures. Character has died. 💀",
          variant: "destructive",
        });
      }
      
      await supabase
        .from("characters")
        .update({ death_save_fail: newFailures })
        .eq("id", characterId);
    }

    // Log the death save
    await supabase.from("combat_log").insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: 0,
      action_type: "save",
      message: `${characterName} rolled ${d20} on death save (${d20 >= 10 ? 'Success' : 'Failure'})`,
      details: { roll: d20, successes: newSuccesses, failures: newFailures },
    });

    setRolling(false);
  };

  const stabilize = async () => {
    await supabase
      .from("characters")
      .update({
        death_save_success: 0,
        death_save_fail: 0,
      })
      .eq("id", characterId);

    await supabase.from("combat_log").insert({
      encounter_id: encounterId,
      character_id: characterId,
      round: 0,
      action_type: "healing",
      message: `${characterName} was stabilized`,
    });

    toast({
      title: "Character Stabilized",
      description: `${characterName} is no longer dying`,
    });
  };

  return (
    <Card className="border-destructive bg-destructive/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Skull className="w-5 h-5" />
          Death Saves - {characterName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-status-buff" />
            <span className="text-sm">Successes:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded border-2 ${
                    i <= successes
                      ? "bg-status-buff border-status-buff"
                      : "border-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm">Failures:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded border-2 ${
                    i <= failures
                      ? "bg-destructive border-destructive"
                      : "border-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={rollDeathSave}
            disabled={rolling || successes >= 3 || failures >= 3}
            size="sm"
            className="flex-1"
          >
            Roll Death Save
          </Button>
          <Button
            onClick={stabilize}
            disabled={successes >= 3}
            variant="outline"
            size="sm"
          >
            <Heart className="w-4 h-4 mr-1" />
            Stabilize
          </Button>
        </div>

        {failures >= 3 && (
          <Badge variant="destructive" className="w-full justify-center">
            DEAD
          </Badge>
        )}
        {successes >= 3 && (
          <Badge variant="secondary" className="w-full justify-center">
            STABLE
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default DeathSaveTracker;
