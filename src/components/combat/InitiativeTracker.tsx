import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, SkipBack, SkipForward, X, Heart, Shield, Dices, Swords, BookOpen, Zap } from "lucide-react";
import { useEncounter } from "@/hooks/useEncounter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCombatActions } from "@/hooks/useCombatActions";
import MonsterDetailDialog from "@/components/monsters/MonsterDetailDialog";
import MonsterActionDialog from "@/components/combat/MonsterActionDialog";
import QuickConditionsPopover from "@/components/combat/QuickConditionsPopover";
import RVITooltip from "@/components/combat/RVITooltip";
import { ActionEconomy } from "@/components/combat/ActionEconomy";
import { ResourceChips } from "@/components/combat/ResourceChips";
import { InspirationToggle } from "@/components/combat/InspirationToggle";
import { QuickHPControls } from "@/components/combat/QuickHPControls";
import { CombatSummary } from "@/components/combat/CombatSummary";
import CombatModifierManager from "./CombatModifierManager";
import CoverSelector from "./CoverSelector";
import { LegendaryTracker } from "@/components/combat/LegendaryTracker";

interface InitiativeTrackerProps {
  encounterId: string;
  characters: Array<{ id: string; name: string }>;
}

interface Combatant {
  id: string;
  name: string;
  type: 'character' | 'monster';
  initiativeBonus: number;
  passivePerception: number;
  dexModifier: number;
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
  
  // Remove virtualization - show all combatants

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

  // Real-time sync for character action economy and resources
  useEffect(() => {
    const channel = supabase
      .channel(`character-updates:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
        },
        () => {
          // Trigger re-fetch of initiative to get updated character stats
          fetchAvailableCombatants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (initiative.length === 0) return;

      if (e.key === '[') {
        e.preventDefault();
        previousTurn();
      } else if (e.key === ']') {
        e.preventDefault();
        nextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [initiative, nextTurn, previousTurn]);

  const fetchAvailableCombatants = async () => {
    // Get characters with tie-breaking stats
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name, initiative_bonus, passive_perception")
      .in("id", characters.map(c => c.id));

    // Get monsters with tie-breaking stats
    const { data: monsters } = await supabase
      .from("encounter_monsters")
      .select("id, display_name, initiative_bonus, abilities")
      .eq("encounter_id", encounterId);

    const combatants: Combatant[] = [];

    // Add characters not in initiative
    chars?.forEach(char => {
      if (!initiative.some(init => init.combatant_id === char.id && init.combatant_type === 'character')) {
        combatants.push({
          id: char.id,
          name: char.name,
          type: 'character',
          initiativeBonus: char.initiative_bonus || 0,
          passivePerception: char.passive_perception || 10,
          dexModifier: char.initiative_bonus || 0 // initiative_bonus IS the dex modifier
        });
      }
    });

    // Add monsters not in initiative
    monsters?.forEach(monster => {
      if (!initiative.some(init => init.combatant_id === monster.id && init.combatant_type === 'monster')) {
        const dex = (monster.abilities as any)?.dex || 10;
        const dexModifier = Math.floor((dex - 10) / 2);
        
        combatants.push({
          id: monster.id,
          name: monster.display_name,
          type: 'monster',
          initiativeBonus: monster.initiative_bonus || 0,
          passivePerception: 10 + dexModifier, // Basic passive perception
          dexModifier: dexModifier
        });
      }
    });

    setAvailableCombatants(combatants);
  };

  const handleToggleSelect = useCallback((combatantId: string) => {
    setSelectedCombatants(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(combatantId)) {
        newSelected.delete(combatantId);
      } else {
        newSelected.add(combatantId);
      }
      return newSelected;
    });
  }, []);

  const handleManualRollChange = useCallback((combatantId: string, value: string) => {
    setManualRolls(prev => ({ ...prev, [combatantId]: value }));
  }, []);

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
      // Check if this is the first initiative roll (no existing combatants)
      const isFirstRoll = initiative.length === 0;

      // Prepare rolls with manual overrides
      const rolls = selected.map((combatant, index) => {
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
          initiativeRoll: total,
          dexModifier: combatant.dexModifier,
          passivePerception: combatant.passivePerception,
          isFirst: isFirstRoll && index === 0
        };
      });

      // Sort by initiative to determine who goes first
      const sortedRolls = [...rolls].sort((a, b) => b.initiativeRoll - a.initiativeRoll);

      // Call backend to add to initiative with tie-breaking stats
      for (let i = 0; i < sortedRolls.length; i++) {
        const roll = sortedRolls[i];
        const { error } = await supabase.from('initiative').insert({
          encounter_id: encounterId,
          combatant_id: roll.combatantId,
          combatant_type: roll.combatantType,
          initiative_roll: roll.initiativeRoll,
          dex_modifier: roll.dexModifier,
          passive_perception: roll.passivePerception,
          is_current_turn: isFirstRoll && i === 0
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

  // Get available targets for monster actions (memoized)
  const actionTargets = useMemo(() => {
    return initiative
      .filter(entry => entry.combatant_type === 'character' && entry.combatant_stats)
      .map(entry => ({
        id: entry.combatant_id,
        name: entry.combatant_name || "Unknown",
        ac: entry.combatant_stats?.ac || 10
      }));
  }, [initiative]);

  // Start combat (set first combatant as current turn)
  const handleStartCombat = async () => {
    if (initiative.length === 0) return;
    
    const { error } = await supabase
      .from("initiative")
      .update({ is_current_turn: true })
      .eq("id", initiative[0].id);

    if (error) {
      toast({
        title: "Error starting combat",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Combat Started",
        description: `${initiative[0].combatant_name}'s turn!`,
      });
    }
  };

  const hasActiveTurn = initiative.some(entry => entry.is_current_turn);

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
        targets={actionTargets}
      />
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Initiative Order</CardTitle>
            <Badge variant="secondary" className="text-sm">
              Round {currentRound}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CombatSummary
              encounterId={encounterId}
              encounterName="Current Encounter"
              totalRounds={currentRound}
            />
            {!hasActiveTurn && initiative.length > 0 && (
              <Button onClick={handleStartCombat} size="sm" variant="default">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {hasActiveTurn && (
              <>
                <Button 
                  onClick={previousTurn} 
                  size="sm" 
                  disabled={initiative.length === 0} 
                  variant="outline"
                  title="Previous Turn ([)"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={nextTurn} 
                  size="sm" 
                  disabled={initiative.length === 0}
                  title="Next Turn (])"
                >
                  Next
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
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

        {/* Initiative List - No scrolling, snap to fit */}
        {initiative.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No combatants in initiative</p>
            <p className="text-sm mt-2">Select combatants above to roll initiative</p>
          </div>
        ) : (
          <div className="space-y-2">
            {initiative.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg p-3 border-2 transition-all ${
                  entry.is_current_turn
                    ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/20"
                    : "bg-muted/50 border-transparent hover:border-muted"
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
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1 items-center flex-wrap">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              AC {entry.combatant_stats.ac}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className={`w-3 h-3 ${entry.combatant_stats.hp_current === 0 ? 'text-destructive' : ''}`} />
                              <span className={entry.combatant_stats.hp_current === 0 ? 'text-destructive font-semibold' : ''}>
                                {entry.combatant_stats.hp_current}/{entry.combatant_stats.hp_max}
                              </span>
                            </span>
                            <QuickHPControls
                              characterId={entry.combatant_id}
                              characterName={entry.combatant_name || "Unknown"}
                              currentHP={entry.combatant_stats.hp_current}
                              maxHP={entry.combatant_stats.hp_max}
                              encounterId={encounterId}
                              currentRound={currentRound}
                              combatantType={entry.combatant_type}
                            />
                            {(entry.combatant_stats.resistances?.length > 0 ||
                              entry.combatant_stats.vulnerabilities?.length > 0 ||
                              entry.combatant_stats.immunities?.length > 0) && (
                              <RVITooltip
                                resistances={entry.combatant_stats.resistances as any || []}
                                vulnerabilities={entry.combatant_stats.vulnerabilities as any || []}
                                immunities={entry.combatant_stats.immunities as any || []}
                              />
                            )}
                          </div>
                        )}
                        {entry.combatant_type === 'character' && entry.combatant_stats && (
                          <div className="flex gap-2 mt-2 items-center flex-wrap">
                            <ActionEconomy
                              characterId={entry.combatant_id}
                              actionUsed={entry.combatant_stats.action_used || false}
                              bonusActionUsed={entry.combatant_stats.bonus_action_used || false}
                              reactionUsed={entry.combatant_stats.reaction_used || false}
                              isDM={true}
                            />
                            <ResourceChips
                              characterId={entry.combatant_id}
                              resources={entry.combatant_stats.resources as any || {}}
                              isDM={true}
                            />
                            <InspirationToggle
                              characterId={entry.combatant_id}
                              hasInspiration={entry.combatant_stats.inspiration || false}
                              isDM={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <CombatModifierManager
                        encounterId={encounterId}
                        actorId={entry.combatant_id}
                        actorType={entry.combatant_type}
                        actorName={entry.combatant_name || "Unknown"}
                        isDM={true}
                      />
                      <CoverSelector
                        encounterId={encounterId}
                        actorId={entry.combatant_id}
                        actorType={entry.combatant_type}
                      />
                      {entry.combatant_type === 'character' && (
                        <QuickConditionsPopover
                          characterId={entry.combatant_id}
                          characterName={entry.combatant_name || "Unknown"}
                          encounterId={encounterId}
                          currentRound={currentRound}
                        />
                      )}
                      {entry.combatant_type === 'monster' && (
                        <>
                          {(entry.combatant_stats as any)?.legendary_actions_max > 0 && (
                            <LegendaryTracker
                              monsterId={entry.combatant_id}
                              monsterName={entry.combatant_name || "Unknown"}
                              legendaryActionsMax={(entry.combatant_stats as any)?.legendary_actions_max || 0}
                              legendaryActionsRemaining={(entry.combatant_stats as any)?.legendary_actions_remaining || 0}
                              legendaryResistancesMax={(entry.combatant_stats as any)?.legendary_resistances_max || 0}
                              legendaryResistancesRemaining={(entry.combatant_stats as any)?.legendary_resistances_remaining || 0}
                              compact
                            />
                          )}
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
            ))}
          </div>
        )}
      </CardContent>
</Card>
</>
);
};

export default InitiativeTracker;
