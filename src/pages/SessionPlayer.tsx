import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import PlayerPresence from "@/components/presence/PlayerPresence";
import DiceRoller from "@/components/dice/DiceRoller";
import RestManager from "@/components/character/RestManager";
import SavePromptListener from "@/components/combat/SavePromptListener";
import { PlayerCharacterSheet } from "@/components/combat/PlayerCharacterSheet";
import { PlayerInitiativeDisplay } from "@/components/player/PlayerInitiativeDisplay";
import { PlayerCombatActions } from "@/components/player/PlayerCombatActions";
import { PlayerMapViewer } from "@/components/player/PlayerMapViewer";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerInventory } from "@/components/player/PlayerInventory";
import { PlayerEffects } from "@/components/player/PlayerEffects";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield, Zap, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  passive_perception: number;
  con_save: number;
  str_save: number;
  dex_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
}

const SessionPlayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignCode = searchParams.get("campaign");
  const { toast } = useToast();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [hpAdjustment, setHpAdjustment] = useState("");
  const [tempHpValue, setTempHpValue] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (!campaignCode) {
      navigate("/campaign-hub");
      return;
    }

    fetchCharacter();
  }, [campaignCode, navigate]);

  useEffect(() => {
    if (!character) return;

    // Subscribe to character changes
    const characterChannel = supabase
      .channel('character-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${character.id}`,
        },
        () => fetchCharacter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(characterChannel);
    };
  }, [character?.id]);

  const fetchCharacter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    // Get campaign by code
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("code", campaignCode);

    if (campaignError || !campaigns || campaigns.length === 0) {
      toast({
        title: "Campaign not found",
        description: "Invalid campaign code",
        variant: "destructive",
      });
      navigate("/campaign-hub");
      return;
    }

    setCampaignId(campaigns[0].id);

    // Check for active encounter
    const { data: encounter } = await supabase
      .from("encounters")
      .select("id")
      .eq("campaign_id", campaigns[0].id)
      .in("status", ["active", "paused"])
      .maybeSingle();

    setActiveEncounter(encounter?.id || null);

    // Fetch map for encounter if exists
    if (encounter?.id) {
      const { data: mapData } = await supabase
        .from("maps")
        .select("id")
        .eq("encounter_id", encounter.id)
        .maybeSingle();
      
      setMapId(mapData?.id || null);
    }

    // Get character for this user in this campaign
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaigns[0].id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error loading character",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (!data) {
      // No character found - show selection dialog
      setShowCharacterSelection(true);
      setLoading(false);
      return;
    }

    setCharacter(data);

    // Check if it's my turn
    if (encounter?.id) {
      const { data: initData } = await supabase
        .from("initiative")
        .select("is_current_turn")
        .eq("encounter_id", encounter.id)
        .eq("combatant_id", data.id)
        .eq("combatant_type", "character")
        .maybeSingle();
      
      setIsMyTurn(initData?.is_current_turn || false);
    }

    // Create or update player presence
    const { data: existingPresence } = await supabase
      .from("player_presence")
      .select("id")
      .eq("campaign_id", campaigns[0].id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingPresence) {
      await supabase
        .from("player_presence")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", existingPresence.id);
    } else {
      await supabase
        .from("player_presence")
        .insert({
          campaign_id: campaigns[0].id,
          user_id: user.id,
          character_id: data.id,
          is_online: true,
        });
    }

    setLoading(false);
  };

  const updateHP = async (amount: number) => {
    if (!character) return;

    const newHP = Math.max(0, Math.min(character.max_hp, character.current_hp + amount));

    const { error } = await supabase
      .from("characters")
      .update({ current_hp: newHP })
      .eq("id", character.id);

    if (error) {
      toast({
        title: "Error updating HP",
        description: error.message,
        variant: "destructive",
      });
    }

    setHpAdjustment("");
  };

  const updateTempHP = async () => {
    if (!character || !tempHpValue) return;

    const { error } = await supabase
      .from("characters")
      .update({ temp_hp: parseInt(tempHpValue) })
      .eq("id", character.id);

    if (error) {
      toast({
        title: "Error updating temp HP",
        description: error.message,
        variant: "destructive",
      });
    }

    setTempHpValue("");
  };

  const getHPPercentage = () => {
    if (!character) return 0;
    return (character.current_hp / character.max_hp) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading character...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">No character found</p>
          <Button onClick={() => navigate("/campaign-hub")}>Back to Campaign Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold">{character.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Level {character.level} {character.class} • Campaign: {campaignCode}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Character Selection Dialog */}
        {showCharacterSelection && campaignId && (
          <CharacterSelectionDialog
            open={showCharacterSelection}
            campaignId={campaignId}
            onComplete={() => {
              setShowCharacterSelection(false);
              fetchCharacter();
            }}
            onCancel={() => navigate("/campaign-hub")}
          />
        )}

        {/* Player Presence */}
        {campaignId && currentUserId && (
          <PlayerPresence
            campaignId={campaignId}
            currentUserId={currentUserId}
            isDM={false}
          />
        )}

        {/* Combat UI - shown when in active encounter */}
        {activeEncounter && campaignId && (
          <Tabs defaultValue="combat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="combat">Combat</TabsTrigger>
              <TabsTrigger value="character">Character</TabsTrigger>
              {mapId && <TabsTrigger value="map">Map</TabsTrigger>}
            </TabsList>

            <TabsContent value="combat" className="space-y-4 mt-4">
              <PlayerCombatActions
                characterId={character.id}
                encounterId={activeEncounter}
                isMyTurn={isMyTurn}
              />
              
              <PlayerInitiativeDisplay
                encounterId={activeEncounter}
                characterId={character.id}
              />

              <PlayerEffects
                characterId={character.id}
                encounterId={activeEncounter}
              />
            </TabsContent>

            <TabsContent value="character" className="space-y-4 mt-4">
              <PlayerCharacterSheet
                characterId={character.id}
                campaignId={campaignId}
                encounterId={activeEncounter}
              />

              <PlayerInventory
                characterId={character.id}
                campaignId={campaignId}
              />
            </TabsContent>

            {mapId && (
              <TabsContent value="map" className="mt-4">
                <PlayerMapViewer
                  mapId={mapId}
                  characterId={character.id}
                />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Out of Combat View */}
        {!activeEncounter && campaignId && (
          <div className="space-y-4">
            {/* HP Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-status-hp" />
                  Hit Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                      {character.current_hp}
                    </span>
                    <span className="text-lg sm:text-xl text-muted-foreground">
                      / {character.max_hp}
                    </span>
                  </div>
                  <Progress value={getHPPercentage()} className="h-3" />
                </div>

                {character.temp_hp > 0 && (
                  <Badge variant="outline" className="bg-secondary/10 border-secondary">
                    +{character.temp_hp} Temporary HP
                  </Badge>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Minus className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Damage</span>
                        <span className="sm:hidden">-HP</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Take Damage</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Damage Amount</Label>
                          <Input
                            type="number"
                            value={hpAdjustment}
                            onChange={(e) => setHpAdjustment(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          onClick={() => updateHP(-parseInt(hpAdjustment || "0"))}
                          className="w-full"
                        >
                          Apply Damage
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Heal</span>
                        <span className="sm:hidden">+HP</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Heal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Healing Amount</Label>
                          <Input
                            type="number"
                            value={hpAdjustment}
                            onChange={(e) => setHpAdjustment(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          onClick={() => updateHP(parseInt(hpAdjustment || "0"))}
                          className="w-full"
                        >
                          Apply Healing
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <span className="hidden sm:inline">Temp HP</span>
                        <span className="sm:hidden">THP</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Temporary HP</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Temporary HP</Label>
                          <Input
                            type="number"
                            value={tempHpValue}
                            onChange={(e) => setTempHpValue(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <Button onClick={updateTempHP} className="w-full">
                          Set Temp HP
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-md">
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{character.ac}</div>
                    <div className="text-xs text-muted-foreground">AC</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <Plus className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">+{character.proficiency_bonus}</div>
                    <div className="text-xs text-muted-foreground">Proficiency</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <Zap className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{character.speed}</div>
                    <div className="text-xs text-muted-foreground">Speed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <PlayerEffects characterId={character.id} encounterId={null} />
            
            <PlayerQuestTracker campaignId={campaignId} />
            
            <PlayerInventory
              characterId={character.id}
              campaignId={campaignId}
            />
          </div>
        )}

        {/* Saving Throw Listener */}
        {campaignId && (
          <SavePromptListener
            characterId={character.id}
            character={character}
            campaignId={campaignId}
          />
        )}

        {/* Rest & Dice Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RestManager character={character} />
          <DiceRoller />
        </div>
      </main>

      <BottomNav role="player" />
    </div>
  );
};

export default SessionPlayer;
