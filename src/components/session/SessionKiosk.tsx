import { useState, useEffect } from "react";
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
import { PlayerJournal } from "@/components/player/PlayerJournal";
import { PlayerSpellbook } from "@/components/player/PlayerSpellbook";
import { PlayerFeatures } from "@/components/player/PlayerFeatures";
import { PlayerChat } from "@/components/player/PlayerChat";
import { PlayerProfile } from "@/components/player/PlayerProfile";
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
  Scroll,
  Zap,
  MessageSquare,
  UserCircle,
} from "lucide-react";

interface SessionCharacter {
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
  hit_dice_current?: number;
  hit_dice_total?: number;
  hit_die?: string;
}

interface SessionKioskProps {
  campaignId: string;
  campaignCode: string;
  currentUserId: string;
  character: SessionCharacter;
  onSessionEnded?: () => void;
  onCharacterUpdate?: () => void;
}

export const SessionKiosk = ({
  campaignId,
  campaignCode,
  currentUserId,
  character: initialCharacter,
  onSessionEnded,
  onCharacterUpdate,
}: SessionKioskProps) => {
  const { toast } = useToast();
  const [character, setCharacter] = useState<SessionCharacter>(initialCharacter);
  const [activeEncounter, setActiveEncounter] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Keep character in sync with parent
  useEffect(() => {
    setCharacter(initialCharacter);
  }, [initialCharacter]);

  // Real-time subscriptions: character, encounters, initiative, session-end
  useEffect(() => {
    const characterChannel = supabase
      .channel(`kiosk-char:${character.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'characters',
        filter: `id=eq.${character.id}`,
      }, async () => {
        const { data } = await supabase
          .from("characters").select("*")
          .eq("id", character.id).maybeSingle();
        if (data) setCharacter(data);
        onCharacterUpdate?.();
      })
      .subscribe();

    const encounterChannel = supabase
      .channel(`kiosk-enc:${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'encounters',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchEncounterStatus())
      .subscribe();

    const initiativeChannel = supabase
      .channel(`kiosk-init:${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'initiative',
      }, () => {
        if (activeEncounter) checkMyTurn(activeEncounter, character.id);
      })
      .subscribe();

    const sessionEndChannel = supabase
      .channel(`kiosk-session-end:${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'campaigns',
        filter: `id=eq.${campaignId}`,
      }, (payload) => {
        if (!payload.new.live_session_id) {
          setSessionEnded(true);
          onSessionEnded?.();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(characterChannel);
      supabase.removeChannel(encounterChannel);
      supabase.removeChannel(initiativeChannel);
      supabase.removeChannel(sessionEndChannel);
    };
  }, [character.id, campaignId, activeEncounter]);

  // Initial encounter check
  useEffect(() => {
    fetchEncounterStatus();
    // Upsert presence
    (async () => {
      const { data: existing } = await supabase
        .from("player_presence").select("id")
        .eq("campaign_id", campaignId).eq("user_id", currentUserId).maybeSingle();
      if (existing) {
        await supabase.from("player_presence")
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("player_presence").insert({
          campaign_id: campaignId, user_id: currentUserId,
          character_id: character.id, is_online: true,
        });
      }
    })();
  }, [campaignId]);

  const fetchEncounterStatus = async () => {
    const { data: encounter } = await supabase
      .from("encounters").select("id, status")
      .eq("campaign_id", campaignId)
      .in("status", ["active", "paused", "preparing"])
      .eq("is_active", true).maybeSingle();

    if (encounter) {
      setActiveEncounter(encounter.id);
      checkMyTurn(encounter.id, character.id);
      const { data: mapData } = await supabase
        .from("maps").select("id")
        .eq("encounter_id", encounter.id).maybeSingle();
      setMapId(mapData?.id || null);
      toast({ title: "⚔️ Combat Active", description: "An encounter has started!" });
    } else {
      if (activeEncounter) {
        toast({ title: "Combat Ended", description: "The encounter has concluded." });
      }
      setActiveEncounter(null);
      setMapId(null);
      setIsMyTurn(false);
    }
  };

  const checkMyTurn = async (encounterId: string, characterId: string) => {
    const { data } = await supabase
      .from("initiative").select("is_current_turn")
      .eq("encounter_id", encounterId)
      .eq("combatant_id", characterId)
      .eq("combatant_type", "character").maybeSingle();

    const nowMyTurn = data?.is_current_turn || false;
    if (!isMyTurn && nowMyTurn) {
      toast({ title: "⚡ Your Turn!", description: "It's your turn to act in combat!" });
    }
    setIsMyTurn(nowMyTurn);
  };

  if (sessionEnded) {
    return (
      <div className="flex items-center justify-center p-6 animate-fade-in">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="font-cinzel">Session Ended</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">The DM has ended this session. Thanks for playing!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Kiosk Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-card/50">
        <h2 className="text-lg font-cinzel font-bold truncate">{character.name}</h2>
        <p className="text-xs text-muted-foreground">
          Lv{character.level} {character.class}
          {activeEncounter && (
            <span className="text-primary font-semibold ml-2">⚔️ In Combat</span>
          )}
          {isMyTurn && (
            <span className="text-status-warning font-semibold ml-2 animate-pulse">⚡ Your Turn!</span>
          )}
        </p>
      </div>

      {/* Player Presence */}
      <PlayerPresence campaignId={campaignId} currentUserId={currentUserId} isDM={false} />

      {/* Kiosk Tabs */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <Tabs defaultValue={activeEncounter ? "combat" : "character"} className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="character"><User className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="combat" disabled={!activeEncounter}><Swords className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="spells"><BookOpen className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="features"><Zap className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="journal"><ScrollText className="w-4 h-4" /></TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile"><UserCircle className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="quests"><Scroll className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="inventory"><Package className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="chat"><MessageSquare className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="map" disabled={!mapId}><MapIcon className="w-4 h-4" /></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="character" className="space-y-4">
            <PlayerCharacterSheet characterId={character.id} />
            <div className="grid grid-cols-1 gap-4">
              <RestManager
                characterId={character.id}
                character={{
                  hit_dice_current: character.hit_dice_current || character.level,
                  hit_dice_total: character.hit_dice_total || character.level,
                  hit_die: character.hit_die || 'd8',
                  current_hp: character.current_hp,
                  max_hp: character.max_hp,
                  level: character.level,
                  con_save: character.con_save,
                }}
              />
              <DiceRoller />
            </div>
          </TabsContent>

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

          <TabsContent value="spells"><PlayerSpellbook characterId={character.id} /></TabsContent>
          <TabsContent value="features"><PlayerFeatures characterId={character.id} /></TabsContent>
          <TabsContent value="journal"><PlayerJournal campaignId={campaignId} characterId={character.id} /></TabsContent>
          <TabsContent value="profile"><PlayerProfile characterId={character.id} /></TabsContent>
          <TabsContent value="quests"><PlayerQuestTracker campaignId={campaignId} /></TabsContent>
          <TabsContent value="inventory"><PlayerInventory characterId={character.id} campaignId={campaignId} /></TabsContent>
          <TabsContent value="chat">
            <PlayerChat campaignId={campaignId} currentUserId={currentUserId} isDM={false} />
          </TabsContent>
          {mapId && (
            <TabsContent value="map">
              <PlayerMapViewer mapId={mapId} characterId={character.id} />
            </TabsContent>
          )}
        </Tabs>

        {/* Save Prompt Listener */}
        <SavePromptListener characterId={character.id} character={character} campaignId={campaignId} />
      </div>
    </div>
  );
};
