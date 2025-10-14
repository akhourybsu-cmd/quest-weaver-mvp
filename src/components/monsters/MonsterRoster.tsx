import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Shield, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import DamageInput from "@/components/combat/DamageInput";
import { useCombatActions } from "@/hooks/useCombatActions";

interface EncounterMonster {
  id: string;
  display_name: string;
  group_key: string;
  name: string;
  type: string;
  size: string;
  ac: number;
  hp_current: number;
  hp_max: number;
  initiative: number;
  is_current_turn: boolean;
}

interface MonsterRosterProps {
  encounterId: string;
  currentRound: number;
}

const MonsterRoster = ({ encounterId, currentRound }: MonsterRosterProps) => {
  const [monsters, setMonsters] = useState<EncounterMonster[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { applyDamage, applyHealing } = useCombatActions();

  useEffect(() => {
    fetchMonsters();

    const channel = supabase
      .channel(`monsters:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encounter_monsters',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchMonsters()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchMonsters = async () => {
    const { data, error } = await supabase
      .from("encounter_monsters")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("initiative", { ascending: false });

    if (error) {
      toast({
        title: "Error loading monsters",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMonsters(data || []);
  };

  const handleRemoveMonster = async (monsterId: string) => {
    const { error } = await supabase
      .from("encounter_monsters")
      .delete()
      .eq("id", monsterId);

    if (error) {
      toast({
        title: "Error removing monster",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDamage = async (monsterId: string, amount: number, damageType: string) => {
    // For monsters, we apply damage directly to the encounter_monsters table
    const monster = monsters.find(m => m.id === monsterId);
    if (!monster) return;

    const newHp = Math.max(0, monster.hp_current - amount);
    
    const { error } = await supabase
      .from("encounter_monsters")
      .update({ hp_current: newHp })
      .eq("id", monsterId);

    if (error) {
      toast({
        title: "Error applying damage",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Damage Applied",
        description: `${monster.display_name} took ${amount} ${damageType} damage`,
      });
    }
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedMonsters = monsters.reduce((acc, monster) => {
    if (!acc[monster.group_key]) {
      acc[monster.group_key] = [];
    }
    acc[monster.group_key].push(monster);
    return acc;
  }, {} as Record<string, EncounterMonster[]>);

  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
  };

  if (monsters.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monsters in Combat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {Object.entries(groupedMonsters).map(([groupKey, groupMonsters]) => {
              const isExpanded = expandedGroups.has(groupKey);
              const groupName = groupMonsters[0].name;
              const totalHP = groupMonsters.reduce((sum, m) => sum + m.hp_current, 0);
              const maxHP = groupMonsters.reduce((sum, m) => sum + m.hp_max, 0);

              return (
                <div key={groupKey} className="border rounded-lg">
                  {/* Group Header */}
                  <div
                    className="p-3 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-semibold">
                        {groupName} ({groupMonsters.length})
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {totalHP} / {maxHP} HP
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded Individual Monsters */}
                  {isExpanded && (
                    <div className="border-t divide-y">
                      {groupMonsters.map((monster) => (
                        <div key={monster.id} className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{monster.display_name}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {monster.size} {monster.type}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMonster(monster.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* HP Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Heart className="w-4 h-4" />
                                <span>HP</span>
                              </div>
                              <span className="font-semibold tabular-nums">
                                {monster.hp_current} / {monster.hp_max}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getHPColor(
                                  monster.hp_current,
                                  monster.hp_max
                                )}`}
                                style={{ width: `${(monster.hp_current / monster.hp_max) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Shield className="w-4 h-4" />
                                <span>AC {monster.ac}</span>
                              </div>
                              <Badge variant={monster.is_current_turn ? "default" : "outline"}>
                                Init {monster.initiative}
                              </Badge>
                            </div>
                            <DamageInput
                              characterId={monster.id}
                              characterName={monster.display_name}
                              onApplyDamage={(amount, type) => handleDamage(monster.id, amount, type)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MonsterRoster;
