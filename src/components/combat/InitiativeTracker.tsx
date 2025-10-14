import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Plus, X, Heart, Shield, Dices, Swords, BookOpen, Zap } from "lucide-react";
import { useEncounter } from "@/hooks/useEncounter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCombatActions } from "@/hooks/useCombatActions";
import MonsterDetailDialog from "@/components/monsters/MonsterDetailDialog";
import MonsterActionDialog from "@/components/combat/MonsterActionDialog";

interface InitiativeTrackerProps {
  encounterId: string;
  characters: Array<{ id: string; name: string }>;
}

interface Combatant {
  id: string;
  name: string;
  type: 'character' | 'monster';
  initiativeBonus: number;
}

const InitiativeTracker = ({ encounterId, characters }: InitiativeTrackerProps) => {
  const { initiative, currentRound, nextTurn, previousTurn, removeFromInitiative } = useEncounter(encounterId);
  const [availableCombatants, setAvailableCombatants] = useState<Combatant[]>([]);
  const [selectedCombatants, setSelectedCombatants] = useState<Set<string>>(new Set());
  const [manualRolls, setManualRolls] = useState<Record<string, string>>({});
  const [selectedMonsterForDetail, setSelectedMonsterForDetail] = useState<any>(null);
  const [selectedMonsterForAction, setSelectedMonsterForAction] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const { rollInitiative } = useCombatActions();
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableCombatants();

    const channel = supabase
      .channel(`combatants:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encounter_monsters',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchAvailableCombatants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, initiative]);

  const fetchAvailableCombatants = async () => {
    // Get characters
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name, initiative_bonus")
      .in("id", characters.map(c => c.id));

    // Get monsters
    const { data: monsters } = await supabase
      .from("encounter_monsters")
      .select("id, display_name, initiative_bonus")
      .eq("encounter_id", encounterId);

    const combatants: Combatant[] = [];

    // Add characters not in initiative
    chars?.forEach(char => {
      if (!initiative.some(init => init.combatant_id === char.id && init.combatant_type === 'character')) {
        combatants.push({
          id: char.id,
          name: char.name,
          type: 'character',
          initiativeBonus: char.initiative_bonus || 0
        });
      }
    });

    // Add monsters not in initiative
    monsters?.forEach(monster => {
      if (!initiative.some(init => init.combatant_id === monster.id && init.combatant_type === 'monster')) {
        combatants.push({
          id: monster.id,
          name: monster.display_name,
          type: 'monster',
          initiativeBonus: monster.initiative_bonus || 0
        });
      }
    });

    setAvailableCombatants(combatants);
  };

  const handleToggleSelect = (combatantId: string) => {
    const newSelected = new Set(selectedCombatants);
    if (newSelected.has(combatantId)) {
      newSelected.delete(combatantId);
    } else {
      newSelected.add(combatantId);
    }
    setSelectedCombatants(newSelected);
  };

  const handleManualRollChange = (combatantId: string, value: string) => {
    setManualRolls(prev => ({ ...prev, [combatantId]: value }));
  };

  const handleRollInitiative = async () => {
    const selected = availableCombatants.filter(c => selectedCombatants.has(c.id));
    if (selected.length === 0) {
      toast({
        title: "No combatants selected",
        description: "Select combatants to roll initiative",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare rolls with manual overrides
      const rolls = selected.map(combatant => {
        const manualRoll = manualRolls[combatant.id];
        let total: number;

        if (manualRoll && manualRoll.trim() !== '') {
          // Manual roll provided
          const roll = parseInt(manualRoll, 10);
          if (isNaN(roll) || roll < 1 || roll > 50) {
            throw new Error(`Invalid initiative roll for ${combatant.name}`);
          }
          total = roll;
        } else {
          // Auto-roll
          const d20 = Math.floor(Math.random() * 20) + 1;
          total = d20 + combatant.initiativeBonus;
        }

        return {
          combatantId: combatant.id,
          combatantType: combatant.type,
          initiativeRoll: total
        };
      });

      // Call backend to add to initiative
      for (const roll of rolls) {
        const { error } = await supabase.from('initiative').insert({
          encounter_id: encounterId,
          combatant_id: roll.combatantId,
          combatant_type: roll.combatantType,
          initiative_roll: roll.initiativeRoll,
          is_current_turn: false
        });

        if (error) throw error;
      }

      toast({
        title: "Initiative Rolled",
        description: `Added ${rolls.length} combatant${rolls.length !== 1 ? 's' : ''} to initiative`,
      });

      setSelectedCombatants(new Set());
      setManualRolls({});
    } catch (error: any) {
      toast({
        title: "Error rolling initiative",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAutoRollAll = async () => {
    if (availableCombatants.length === 0) {
      toast({
        title: "No combatants available",
        variant: "destructive",
      });
      return;
    }

    // Auto-select all and roll
    setSelectedCombatants(new Set(availableCombatants.map(c => c.id)));
    setManualRolls({});

    // Wait a tick for state to update
    setTimeout(handleRollInitiative, 100);
  };

  const handleViewMonsterDetail = async (combatantId: string, combatantType: string) => {
    if (combatantType !== 'monster') return;

    const { data: monster } = await supabase
      .from('encounter_monsters')
      .select('*')
      .eq('id', combatantId)
      .single();

    if (monster) {
      setSelectedMonsterForDetail(monster);
      setDetailDialogOpen(true);
    }
  };

  const handleOpenMonsterActions = async (combatantId: string, combatantType: string) => {
    if (combatantType !== 'monster') return;

    const { data: monster } = await supabase
      .from('encounter_monsters')
      .select('*')
      .eq('id', combatantId)
      .single();

    if (monster) {
      setSelectedMonsterForAction(monster);
      setActionDialogOpen(true);
    }
  };

  // Get available targets for monster actions
  const getActionTargets = () => {
    return initiative
      .filter(entry => entry.combatant_type === 'character' && entry.combatant_stats)
      .map(entry => ({
        id: entry.combatant_id,
        name: entry.combatant_name || "Unknown",
        ac: entry.combatant_stats?.ac || 10
      }));
  };

  return (
    <>
      <MonsterDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        monster={selectedMonsterForDetail}
      />
      <MonsterActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        monster={selectedMonsterForAction}
        encounterId={encounterId}
        targets={getActionTargets()}
      />
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Initiative Order - Round {currentRound}</CardTitle>
          <div className="flex gap-2">
            <Button onClick={previousTurn} size="sm" disabled={initiative.length === 0} variant="outline">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Previous
            </Button>
            <Button onClick={nextTurn} size="sm" disabled={initiative.length === 0}>
              <ChevronRight className="w-4 h-4 mr-1" />
              Next Turn
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-4">
        {/* Add to Initiative */}
        {availableCombatants.length > 0 && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Add to Initiative</h4>
              <div className="flex gap-2">
                <Button onClick={handleAutoRollAll} size="sm" variant="outline">
                  <Dices className="w-4 h-4 mr-1" />
                  Auto-Roll All
                </Button>
                <Button 
                  onClick={handleRollInitiative} 
                  size="sm"
                  disabled={selectedCombatants.size === 0}
                >
                  <Swords className="w-4 h-4 mr-1" />
                  Roll Selected ({selectedCombatants.size})
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {availableCombatants.map(combatant => (
                  <div key={combatant.id} className="flex items-center gap-2 bg-background p-2 rounded">
                    <Checkbox
                      checked={selectedCombatants.has(combatant.id)}
                      onCheckedChange={() => handleToggleSelect(combatant.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{combatant.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {combatant.type === 'character' ? 'PC' : 'NPC'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          +{combatant.initiativeBonus}
                        </span>
                      </div>
                    </div>
                    <Input
                      type="number"
                      placeholder="Auto"
                      value={manualRolls[combatant.id] || ''}
                      onChange={(e) => handleManualRollChange(combatant.id, e.target.value)}
                      className="w-20 h-8 text-sm"
                      min="1"
                      max="50"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Initiative List */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {initiative.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No combatants in initiative</p>
                <p className="text-sm mt-2">Select combatants above to roll initiative</p>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-lg font-bold w-10 justify-center shrink-0">
                        {entry.initiative_roll}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          {entry.combatant_type === 'monster' ? (
                            <button
                              onClick={() => handleViewMonsterDetail(entry.combatant_id, entry.combatant_type)}
                              className="hover:text-primary transition-colors hover:underline text-left"
                            >
                              {entry.combatant_name || "Unknown"}
                            </button>
                          ) : (
                            <span>{entry.combatant_name || "Unknown"}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {entry.combatant_type === 'character' ? 'PC' : 'NPC'}
                          </Badge>
                          {entry.is_current_turn && (
                            <Badge variant="default" className="text-xs">
                              Current Turn
                            </Badge>
                          )}
                        </div>
                        {entry.combatant_stats && (
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              AC {entry.combatant_stats.ac}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {entry.combatant_stats.hp_current}/{entry.combatant_stats.hp_max}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {entry.combatant_type === 'monster' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMonsterDetail(entry.combatant_id, entry.combatant_type)}
                            title="View Monster Details"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMonsterActions(entry.combatant_id, entry.combatant_type)}
                            title="Use Monster Actions"
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromInitiative(entry.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
    </>
  );
};

export default InitiativeTracker;
