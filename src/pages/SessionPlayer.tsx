import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlayerPresence from "@/components/presence/PlayerPresence";
import DiceRoller from "@/components/dice/DiceRoller";
import RestManager from "@/components/character/RestManager";
import SavePromptListener from "@/components/combat/SavePromptListener";
import { PlayerCharacterSheet } from "@/components/player/PlayerCharacterSheet";
import { PlayerCombatView } from "@/components/player/PlayerCombatView";
import { PlayerMapViewer } from "@/components/player/PlayerMapViewer";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerInventory } from "@/components/player/PlayerInventory";
import { PlayerEffects } from "@/components/player/PlayerEffects";
import { PlayerJournal } from "@/components/player/PlayerJournal";
import { PlayerBackstory } from "@/components/player/PlayerBackstory";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Swords, 
  BookOpen, 
  ScrollText, 
  Package, 
  Map as MapIcon,
  Scroll 
} from "lucide-react";

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
    
    console.log('SessionPlayer - Character loaded:', data.name);
    console.log('SessionPlayer - Active encounter:', encounter?.id);
    console.log('SessionPlayer - Campaign ID:', campaigns[0].id);

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

  console.log('SessionPlayer - Rendering with activeEncounter:', activeEncounter);
  console.log('SessionPlayer - campaignId:', campaignId);
  console.log('SessionPlayer - mapId:', mapId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold">{character.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Level {character.level} {character.class} • Campaign: {campaignCode}
            </p>
            {activeEncounter && (
              <p className="text-xs text-primary font-semibold">⚔️ In Combat</p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
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

        <Tabs defaultValue={activeEncounter ? "combat" : "character"} className="space-y-4">
          <div className="space-y-2">
            {/* Top Row - Primary Tabs */}
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="character">
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Character</span>
              </TabsTrigger>
              <TabsTrigger value="combat" disabled={!activeEncounter}>
                <Swords className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Combat</span>
              </TabsTrigger>
              <TabsTrigger value="journal">
                <BookOpen className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Journal</span>
              </TabsTrigger>
              <TabsTrigger value="backstory">
                <ScrollText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Story</span>
              </TabsTrigger>
            </TabsList>

            {/* Bottom Row - Secondary Tabs */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quests">
                <Scroll className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Quests</span>
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Package className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="map" disabled={!mapId}>
                <MapIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Character Tab */}
          <TabsContent value="character" className="space-y-4">
            <PlayerCharacterSheet characterId={character.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RestManager character={character} />
              <DiceRoller />
            </div>
          </TabsContent>

          {/* Combat Tab */}
          {activeEncounter && (
            <TabsContent value="combat" className="space-y-4">
              <PlayerCombatView
                characterId={character.id}
                characterName={character.name}
                encounterId={activeEncounter}
                isMyTurn={isMyTurn}
              />
            </TabsContent>
          )}

          {/* Journal Tab */}
          <TabsContent value="journal" className="space-y-4">
            <PlayerJournal campaignId={campaignId} characterId={character.id} />
          </TabsContent>

          {/* Backstory Tab */}
          <TabsContent value="backstory" className="space-y-4">
            <PlayerBackstory characterId={character.id} />
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests" className="space-y-4">
            <PlayerQuestTracker campaignId={campaignId} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <PlayerInventory
              characterId={character.id}
              campaignId={campaignId}
            />
          </TabsContent>

          {/* Map Tab */}
          {mapId && (
            <TabsContent value="map" className="space-y-4">
              <PlayerMapViewer
                mapId={mapId}
                characterId={character.id}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Saving Throw Listener */}
        {campaignId && (
          <SavePromptListener
            characterId={character.id}
            character={character}
            campaignId={campaignId}
          />
        )}

      </main>
    </div>
  );
};

export default SessionPlayer;
