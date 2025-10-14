import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Plus, X, Heart, Shield, Dices } from "lucide-react";
import { useEncounter } from "@/hooks/useEncounter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateModifier } from "@/lib/dnd5e";

interface InitiativeTrackerProps {
  encounterId: string;
  characters: Array<{ id: string; name: string }>;
}

const InitiativeTracker = ({ encounterId, characters }: InitiativeTrackerProps) => {
  const { initiative, currentRound, addToInitiative, nextTurn, removeFromInitiative } = useEncounter(encounterId);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [initiativeRoll, setInitiativeRoll] = useState("");
  const { toast } = useToast();

  const handleAddToInitiative = async () => {
    if (!selectedCharacterId || !initiativeRoll) return;
    
    const roll = parseInt(initiativeRoll, 10);
    if (isNaN(roll) || roll < 1 || roll > 50) {
      toast({
        title: "Invalid initiative roll",
        description: "Initiative must be between 1 and 50",
        variant: "destructive",
      });
      return;
    }
    
    await addToInitiative(selectedCharacterId, roll);
    setSelectedCharacterId("");
    setInitiativeRoll("");
  };

  const handleAutoRoll = async () => {
    // Fetch character stats to get ability scores, not saves
    const { data: characterStats } = await supabase
      .from("characters")
      .select("id, name, class")
      .in("id", availableCharacters.map(c => c.id));

    if (!characterStats) {
      toast({
        title: "Error fetching character data",
        variant: "destructive",
      });
      return;
    }

    // Need to get full character data including ability scores
    const { data: fullCharData, error } = await supabase
      .from("characters")
      .select("*")
      .in("id", availableCharacters.map(c => c.id));

    if (error || !fullCharData) {
      toast({
        title: "Error fetching character data",
        description: error?.message,
        variant: "destructive",
      });
      return;
    }

    for (const char of fullCharData) {
      const roll = Math.floor(Math.random() * 20) + 1;
      // Use initiative_bonus field directly
      const initiativeBonus = char.initiative_bonus ?? 0;
      const total = roll + initiativeBonus;
      await addToInitiative(char.id, total);
    }

    toast({
      title: "Initiative Rolled",
      description: `Rolled initiative for ${fullCharData.length} characters`,
    });
  };

  const availableCharacters = characters.filter(
    char => !initiative.some(init => init.character_id === char.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Initiative Order - Round {currentRound}</CardTitle>
          <div className="flex gap-2">
            {availableCharacters.length > 0 && (
              <Button onClick={handleAutoRoll} size="sm" variant="outline">
                <Dices className="w-4 h-4 mr-1" />
                Auto-Roll
              </Button>
            )}
            <Button onClick={nextTurn} size="sm" disabled={initiative.length === 0}>
              <ChevronRight className="w-4 h-4 mr-1" />
              Next Turn
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add to Initiative */}
        {availableCharacters.length > 0 && (
          <div className="flex gap-2">
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select character...</option>
              {availableCharacters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Roll"
              value={initiativeRoll}
              onChange={(e) => setInitiativeRoll(e.target.value)}
              className="w-24"
              min="1"
              max="50"
            />
            <Button onClick={handleAddToInitiative} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Initiative List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {initiative.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No combatants yet</p>
                <p className="text-sm mt-2">Add characters to initiative above</p>
              </div>
            ) : (
              initiative.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-lg p-3 border-2 transition-all ${
                    entry.is_current_turn
                      ? "bg-primary/10 border-primary shadow-md"
                      : "bg-muted/50 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="secondary" className="text-lg font-bold w-10 justify-center">
                        {entry.initiative_roll}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {entry.character?.name || "Unknown"}
                          {entry.is_current_turn && (
                            <Badge variant="default" className="text-xs">
                              Current Turn
                            </Badge>
                          )}
                        </div>
                        {entry.character && (
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              AC {entry.character.ac}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {entry.character.current_hp}/{entry.character.max_hp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromInitiative(entry.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InitiativeTracker;
