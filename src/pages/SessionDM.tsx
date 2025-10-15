import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCombatActions } from "@/hooks/useCombatActions";
import BottomNav from "@/components/BottomNav";
import PlayerPresence from "@/components/presence/PlayerPresence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield, Eye, Plus, Swords, Map, Users } from "lucide-react";
import CombatLog from "@/components/combat/CombatLog";
import ConcentrationTracker from "@/components/combat/ConcentrationTracker";
import ConditionsManager from "@/components/combat/ConditionsManager";
import EffectsList from "@/components/combat/EffectsList";
import InitiativeTracker from "@/components/combat/InitiativeTracker";
import SavePromptDialog from "@/components/combat/SavePromptDialog";
import SavePromptsList from "@/components/combat/SavePromptsList";
import DamageInput from "@/components/combat/DamageInput";
import EffectDialog from "@/components/combat/EffectDialog";
import MonsterLibraryDialog from "@/components/monsters/MonsterLibraryDialog";
import MonsterRoster from "@/components/monsters/MonsterRoster";

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  passive_perception: number;
  speed: number;
  resistances: string[];
  vulnerabilities: string[];
  immunities: string[];
}

interface Encounter {
  id: string;
  name: string;
  current_round: number;
  is_active: boolean;
}

const SessionDM = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const { toast } = useToast();
  const { applyDamage: applyDamageAction, applyHealing } = useCombatActions();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      navigate("/campaign-hub");
      return;
    }

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };

    loadUser();
    fetchCampaignData();
    
    // Subscribe to character changes with unique channel names
    const charactersChannel = supabase
      .channel(`dm-characters:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchCharacters()
      )
      .subscribe();

    // Subscribe to encounter changes
    const encountersChannel = supabase
      .channel(`dm-encounters:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encounters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchActiveEncounter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(charactersChannel);
      supabase.removeChannel(encountersChannel);
    };
  }, [campaignId, navigate]);

  const fetchCampaignData = async () => {
    await Promise.all([fetchCharacters(), fetchActiveEncounter()]);
    setLoading(false);
  };

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    if (error) {
      toast({
        title: "Error loading characters",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCharacters(data || []);
  };

  const fetchActiveEncounter = async () => {
    const { data, error } = await supabase
      .from("encounters")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error loading encounter",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setActiveEncounter(data);
  };

  const createEncounter = async () => {
    const { data, error } = await supabase
      .from("encounters")
      .insert({
        campaign_id: campaignId,
        name: `Encounter ${new Date().toLocaleDateString()}`,
        current_round: 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating encounter",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setActiveEncounter(data);
    toast({
      title: "Encounter Started",
      description: "Roll initiative!",
    });
  };

  const endEncounter = async () => {
    if (!activeEncounter) return;

    const { error } = await supabase
      .from("encounters")
      .update({ is_active: false })
      .eq("id", activeEncounter.id);

    if (error) {
      toast({
        title: "Error ending encounter",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setActiveEncounter(null);
    toast({
      title: "Encounter Ended",
      description: "Victory!",
    });
  };

  const applyDamage = async (
    characterId: string, 
    amount: number, 
    damageType: string,
    sourceName?: string,
    abilityName?: string
  ) => {
    if (!activeEncounter) return;

    try {
      await applyDamageAction(
        characterId,
        amount,
        damageType,
        activeEncounter.id,
        activeEncounter.current_round,
        sourceName,
        abilityName
      );
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePromptSave = async (data: {
    ability: string;
    dc: number;
    description: string;
    targetScope: string;
    advantageMode: string;
    halfOnSuccess: boolean;
  }) => {
    if (!activeEncounter) return;

    try {
      // Compute targets server-side using helper function
      const { data: targets } = await supabase.rpc('compute_save_prompt_targets', {
        _encounter_id: activeEncounter.id,
        _target_scope: data.targetScope as any,
        _target_character_ids: null
      });

      const targetCount = targets?.length || 0;

      const { error } = await supabase.from("save_prompts").insert([{
        encounter_id: activeEncounter.id,
        ability: data.ability as any,
        dc: data.dc,
        description: data.description,
        target_scope: data.targetScope as any,
        advantage_mode: data.advantageMode as any,
        half_on_success: data.halfOnSuccess,
        target_character_ids: targets,
        expected_responses: targetCount,
        received_responses: 0,
      }]);

      if (error) throw error;

      toast({
        title: "Save Prompt Sent",
        description: `${targetCount} combatant${targetCount !== 1 ? 's' : ''} must make a ${data.ability} save (DC ${data.dc})`,
      });
    } catch (error: any) {
      toast({
        title: "Error sending save prompt",
        description: error.message || "Failed to send save prompt",
        variant: "destructive",
      });
    }
  };

  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading campaign...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DM Screen</h1>
              <p className="text-sm text-muted-foreground">
                {activeEncounter ? `Round ${activeEncounter.current_round}` : "No active encounter"}
              </p>
            </div>
            {activeEncounter ? (
              <Button onClick={endEncounter} variant="destructive" size="sm">
                End Combat
              </Button>
            ) : (
              <Button onClick={createEncounter} size="sm">
                <Swords className="w-4 h-4 mr-2" />
                Start Combat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Player Presence */}
        {currentUserId && (
          <PlayerPresence
            campaignId={campaignId}
            currentUserId={currentUserId}
            isDM={true}
          />
        )}

        <Tabs defaultValue="party" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="party">
              <Users className="w-4 h-4 mr-2" />
              Party
            </TabsTrigger>
            <TabsTrigger value="combat" disabled={!activeEncounter}>
              <Swords className="w-4 h-4 mr-2" />
              Combat
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="w-4 h-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          {/* Party Overview Tab */}
          <TabsContent value="party" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-md">
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{characters.length}</div>
                    <div className="text-sm text-muted-foreground">Party Members</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">
                      {Math.round(characters.reduce((sum, c) => sum + c.current_hp, 0) / characters.length) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg HP</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Party Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No characters in this campaign yet</p>
                    <p className="text-sm mt-2">Players can join using the campaign code</p>
                  </div>
                ) : (
                  characters.map((character) => (
                    <div
                      key={character.id}
                      className="bg-muted/50 rounded-lg p-4 space-y-3 transition-all hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedCharacterId(character.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{character.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Level {character.level} {character.class}
                          </p>
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Heart className="w-4 h-4" />
                            <span>HP</span>
                            {character.temp_hp > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                +{character.temp_hp} temp
                              </Badge>
                            )}
                          </div>
                          <span className="font-semibold tabular-nums">
                            {character.current_hp} / {character.max_hp}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getHPColor(
                              character.current_hp,
                              character.max_hp
                            )}`}
                            style={{ width: `${(character.current_hp / character.max_hp) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>AC {character.ac}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span>Passive {character.passive_perception}</span>
                          </div>
                        </div>
                        <DamageInput
                          characterId={character.id}
                          characterName={character.name}
                          onApplyDamage={(amount, type, source, ability) => 
                            applyDamage(character.id, amount, type, source, ability)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Combat Tab */}
          <TabsContent value="combat" className="space-y-4">
            {activeEncounter && (
              <>
                <div className="flex gap-2">
                  <MonsterLibraryDialog 
                    encounterId={activeEncounter.id}
                    onMonstersAdded={fetchCampaignData}
                  />
                  <SavePromptDialog
                    encounterId={activeEncounter.id}
                    onPromptSave={handlePromptSave}
                  />
                  <EffectDialog
                    encounterId={activeEncounter.id}
                    currentRound={activeEncounter.current_round}
                    characters={characters.map(c => ({ id: c.id, name: c.name }))}
                  />
                </div>
                <SavePromptsList encounterId={activeEncounter.id} />
                <InitiativeTracker
                  encounterId={activeEncounter.id}
                  characters={characters.map(c => ({ id: c.id, name: c.name }))}
                />
                <CombatLog encounterId={activeEncounter.id} />
                <MonsterRoster 
                  encounterId={activeEncounter.id}
                  currentRound={activeEncounter.current_round}
                />
                <ConcentrationTracker encounterId={activeEncounter.id} />
                <ConditionsManager
                  encounterId={activeEncounter.id}
                  currentRound={activeEncounter.current_round}
                  characters={characters.map(c => ({ id: c.id, name: c.name }))}
                />
                <EffectsList encounterId={activeEncounter.id} />
              </>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={() => navigate(`/map?campaignId=${campaignId}${activeEncounter ? `&encounterId=${activeEncounter.id}` : ''}`)}
                  className="w-full"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Open Battle Map
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>


      <BottomNav role="dm" />
    </div>
  );
};

export default SessionDM;
