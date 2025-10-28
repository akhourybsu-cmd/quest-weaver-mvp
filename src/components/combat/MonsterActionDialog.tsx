import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MonsterActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monster: any;
  encounterId: string;
  targets: Array<{ id: string; name: string; ac: number }>;
}

const MonsterActionDialog = ({ open, onOpenChange, monster, encounterId, targets }: MonsterActionDialogProps) => {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [attackRoll, setAttackRoll] = useState<string>("");
  const [damageRoll, setDamageRoll] = useState<string>("");
  const [autoMode, setAutoMode] = useState(true);
  const { toast } = useToast();

  const parseAction = (action: any) => {
    const desc = action.desc || "";
    
    // Extract attack bonus (e.g., "+7 to hit")
    const attackMatch = desc.match(/([+-]\d+)\s+to\s+hit/i);
    const attackBonus = attackMatch ? parseInt(attackMatch[1]) : 0;
    
    // Extract damage (e.g., "2d6 + 4 slashing")
    const damageMatch = desc.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+(\w+)\s+damage/i);
    const damageDice = damageMatch ? damageMatch[1] : null;
    const damageType = damageMatch ? damageMatch[2] : "bludgeoning";
    
    // Extract DC for saves (e.g., "DC 15 Constitution")
    const dcMatch = desc.match(/DC\s+(\d+)\s+(\w+)/i);
    const saveDC = dcMatch ? parseInt(dcMatch[1]) : null;
    const saveAbility = dcMatch ? dcMatch[2].toLowerCase() : null;
    
    return {
      name: action.name,
      desc: action.desc,
      attackBonus,
      damageDice,
      damageType,
      saveDC,
      saveAbility,
      isAttack: attackBonus !== 0 || desc.includes("to hit"),
      isSave: saveDC !== null
    };
  };

  const rollDice = (formula: string): number => {
    // Parse dice formula like "2d6+4" or "1d8"
    const match = formula.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!match) return 0;
    
    const [, numDice, diceSize, operator, modifier] = match;
    let total = 0;
    
    for (let i = 0; i < parseInt(numDice); i++) {
      total += Math.floor(Math.random() * parseInt(diceSize)) + 1;
    }
    
    if (operator && modifier) {
      total += operator === '+' ? parseInt(modifier) : -parseInt(modifier);
    }
    
    return total;
  };

  const handleExecuteAction = async () => {
    if (!selectedAction || !selectedTargetId) {
      toast({
        title: "Missing Information",
        description: "Please select an action and target",
        variant: "destructive",
      });
      return;
    }

    const parsedAction = parseAction(selectedAction);
    const target = targets.find(t => t.id === selectedTargetId);
    if (!target) return;

    try {
      if (parsedAction.isAttack) {
        // Handle attack roll
        const attack = autoMode 
          ? Math.floor(Math.random() * 20) + 1 + parsedAction.attackBonus
          : parseInt(attackRoll) + parsedAction.attackBonus;

        // Ensure AC is a number - handle string or object cases
        const targetAC = typeof target.ac === 'number' ? target.ac : parseInt(String(target.ac)) || 10;
        
        console.log('Attack comparison:', { attack, targetAC, rawAC: target.ac, hit: attack >= targetAC });
        
        const hit = attack >= targetAC;

        if (hit) {
          // Attack hits!
          if (parsedAction.damageDice || (!autoMode && damageRoll)) {
            // Calculate damage based on mode
            let damage = 0;
            if (autoMode && parsedAction.damageDice) {
              damage = rollDice(parsedAction.damageDice);
            } else if (!autoMode && damageRoll) {
              damage = parseInt(damageRoll);
            } else if (!autoMode && !damageRoll) {
              toast({
                title: "Missing Damage",
                description: "Please enter the damage roll amount",
                variant: "destructive",
              });
              return;
            }

            if (damage > 0) {
              // Apply damage via edge function
              const { error } = await supabase.functions.invoke('apply-damage', {
                body: {
                  characterId: target.id,
                  amount: damage,
                  damageType: parsedAction.damageType,
                  encounterId,
                  currentRound: 1,
                }
              });

              if (error) throw error;

              toast({
                title: "Attack Hit!",
                description: `${monster.display_name} hit ${target.name} with ${selectedAction.name} for ${damage} ${parsedAction.damageType} damage (Attack: ${attack} vs AC ${targetAC})`,
              });
            }
          } else {
            // Hit but no damage dice found and not manual - might be special attack
            toast({
              title: "Attack Hit!",
              description: `${monster.display_name} hit ${target.name} with ${selectedAction.name} (Attack: ${attack} vs AC ${targetAC}). Manually apply damage if needed.`,
            });
          }
        } else {
          toast({
            title: "Attack Missed",
            description: `${monster.display_name}'s ${selectedAction.name} missed ${target.name} (Attack: ${attack} vs AC ${targetAC})`,
          });
        }
      } else if (parsedAction.isSave) {
        // Create save prompt
        const { error } = await supabase.functions.invoke('create-save-prompt', {
          body: {
            encounterId,
            description: `${monster.display_name} uses ${selectedAction.name}`,
            ability: parsedAction.saveAbility,
            dc: parsedAction.saveDC,
            targetScope: 'custom',
            targetCharacterIds: [target.id],
            halfOnSuccess: true
          }
        });

        if (error) throw error;

        toast({
          title: "Save Prompt Created",
          description: `${target.name} must make a DC ${parsedAction.saveDC} ${parsedAction.saveAbility?.toUpperCase()} save`,
        });
      } else {
        // Generic action
        toast({
          title: "Action Used",
          description: `${monster.display_name} uses ${selectedAction.name} on ${target.name}`,
        });
      }

      onOpenChange(false);
      setSelectedAction(null);
      setSelectedTargetId("");
      setAttackRoll("");
      setDamageRoll("");
    } catch (error: any) {
      toast({
        title: "Error executing action",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!monster) return null;

  const actions = monster.actions || [];
  const reactions = monster.reactions || [];
  const legendaryActions = monster.legendary_actions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {monster.display_name} - Combat Actions
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Actions List */}
          <div className="space-y-3">
            <Tabs defaultValue="actions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="reactions">Reactions</TabsTrigger>
                <TabsTrigger value="legendary">Legendary</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="mt-3">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-3">
                    {actions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No actions available</p>
                    ) : (
                      actions.map((action: any, idx: number) => {
                        const parsed = parseAction(action);
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedAction(action)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedAction?.name === action.name ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-sm">{action.name}</span>
                              <div className="flex gap-1">
                                {parsed.isAttack && <Badge variant="outline" className="text-xs">Attack</Badge>}
                                {parsed.isSave && <Badge variant="outline" className="text-xs">Save</Badge>}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{action.desc}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="reactions" className="mt-3">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-3">
                    {reactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No reactions available</p>
                    ) : (
                      reactions.map((reaction: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAction(reaction)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedAction?.name === reaction.name ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                        >
                          <span className="font-semibold text-sm block mb-1">{reaction.name}</span>
                          <p className="text-xs text-muted-foreground line-clamp-2">{reaction.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="legendary" className="mt-3">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-3">
                    {legendaryActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No legendary actions available</p>
                    ) : (
                      legendaryActions.map((action: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAction(action)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedAction?.name === action.name ? 'ring-2 ring-primary bg-primary/5' : ''
                          }`}
                        >
                          <span className="font-semibold text-sm block mb-1">{action.name}</span>
                          <p className="text-xs text-muted-foreground line-clamp-2">{action.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Execution Panel */}
          <div className="space-y-4">
            {selectedAction && (
              <>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-sm mb-2">{selectedAction.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedAction.desc}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">Select Target...</option>
                      {targets.map(target => (
                        <option key={target.id} value={target.id}>
                          {target.name} (AC {target.ac})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-sm font-medium">Mode</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={autoMode ? "default" : "outline"}
                        onClick={() => setAutoMode(true)}
                      >
                        <Dices className="w-4 h-4 mr-1" />
                        Auto-Roll
                      </Button>
                      <Button
                        size="sm"
                        variant={!autoMode ? "default" : "outline"}
                        onClick={() => setAutoMode(false)}
                      >
                        Manual
                      </Button>
                    </div>
                  </div>

                  {!autoMode && parseAction(selectedAction).isAttack && (
                    <div className="space-y-2">
                      <div>
                        <Label>Attack Roll (d20 only)</Label>
                        <Input
                          type="number"
                          placeholder="Enter d20 result (bonus added automatically)..."
                          value={attackRoll}
                          onChange={(e) => setAttackRoll(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Damage Roll</Label>
                        <Input
                          type="number"
                          placeholder="Enter damage..."
                          value={damageRoll}
                          onChange={(e) => setDamageRoll(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleExecuteAction}
                    className="w-full"
                    disabled={!selectedTargetId}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Execute Action
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterActionDialog;
