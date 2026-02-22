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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Shield,
  Heart,
  Lock,
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

const TAB_ITEMS: ReadonlyArray<{
  value: string;
  icon: typeof User;
  label: string;
  requiresEncounter?: boolean;
  requiresMap?: boolean;
}> = [
  { value: "character", icon: User, label: "Character" },
  { value: "combat", icon: Swords, label: "Combat", requiresEncounter: true },
  { value: "spells", icon: BookOpen, label: "Spells" },
  { value: "features", icon: Zap, label: "Features" },
  { value: "journal", icon: ScrollText, label: "Journal" },
  { value: "profile", icon: UserCircle, label: "Profile" },
  { value: "quests", icon: Scroll, label: "Quests" },
  { value: "inventory", icon: Package, label: "Inventory" },
  { value: "chat", icon: MessageSquare, label: "Chat" },
  { value: "map", icon: MapIcon, label: "Map", requiresMap: true },
];

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

  // Real-time subscriptions
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

  const isTabDisabled = (tab: (typeof TAB_ITEMS)[number]) => {
    if (tab.requiresEncounter && !activeEncounter) return true;
    if (tab.requiresMap && !mapId) return true;
    return false;
  };

  // Session Ended — Dramatic Curtain Call
  if (sessionEnded) {
    return (
      <div className="flex items-center justify-center p-6 h-full relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
        <Card className="max-w-md w-full text-center relative z-10 border-brand-brass/30 animate-scale-in shadow-lg">
          <CardHeader className="pb-2">
            <Swords className="w-10 h-10 mx-auto text-brand-brass mb-2" />
            <CardTitle className="font-cinzel text-xl">Session Ended</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">The DM has ended this session. Thanks for playing!</p>
            <p className="font-cormorant italic text-sm text-muted-foreground/70">
              The tale pauses here... until next time, adventurer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fantasy Header Strip */}
      <div className="px-4 py-3 border-b-2 border-brand-brass/30 bg-gradient-to-r from-card via-card/90 to-card animate-fade-in">
        <h2 className="text-lg font-cinzel font-bold truncate text-foreground" style={{ textShadow: '0 1px 4px hsl(var(--brass) / 0.15)' }}>
          {character.name}
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>Lv{character.level} {character.class}</span>
          <span className="flex items-center gap-0.5">
            <Shield className="w-3 h-3 text-brand-brass" /> {character.ac}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className="w-3 h-3 text-status-hp" /> {character.current_hp}/{character.max_hp}
          </span>
          {activeEncounter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-brass/10 border border-brand-brass/30 text-brand-brass font-semibold animate-pulse-breathe text-[10px]">
              ⚔️ In Combat
            </span>
          )}
          {isMyTurn && (
            <span className="font-semibold animate-flash-gold text-[10px]">
              ⚡ Your Turn!
            </span>
          )}
        </div>
      </div>

      {/* Player Presence */}
      <PlayerPresence campaignId={campaignId} currentUserId={currentUserId} isDM={false} />

      {/* Ornate Tabs */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <Tabs defaultValue={activeEncounter ? "combat" : "character"} className="mt-3 space-y-3">
          <TooltipProvider delayDuration={300}>
            <TabsList className="flex w-full overflow-x-auto scrollbar-hide gap-0.5 h-auto p-1 bg-muted/50 rounded-lg">
              {TAB_ITEMS.map((tab) => {
                const disabled = isTabDisabled(tab);
                const Icon = tab.icon;
                return (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <span className="relative flex-shrink-0">
                        <TabsTrigger
                          value={tab.value}
                          disabled={disabled}
                          className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-0
                            data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-brand-brass
                            data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:block text-[10px] leading-none">{tab.label}</span>
                          {disabled && (
                            <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-muted-foreground/50" />
                          )}
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {tab.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TabsList>
          </TooltipProvider>

          <TabsContent value="character" className="space-y-4 tab-enter">
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
            <TabsContent value="combat" className="space-y-4 tab-enter">
              <PlayerCombatView
                characterId={character.id}
                characterName={character.name}
                encounterId={activeEncounter}
                isMyTurn={isMyTurn}
              />
            </TabsContent>
          )}

          <TabsContent value="spells" className="tab-enter"><PlayerSpellbook characterId={character.id} /></TabsContent>
          <TabsContent value="features" className="tab-enter"><PlayerFeatures characterId={character.id} /></TabsContent>
          <TabsContent value="journal" className="tab-enter"><PlayerJournal campaignId={campaignId} characterId={character.id} /></TabsContent>
          <TabsContent value="profile" className="tab-enter"><PlayerProfile characterId={character.id} /></TabsContent>
          <TabsContent value="quests" className="tab-enter"><PlayerQuestTracker campaignId={campaignId} /></TabsContent>
          <TabsContent value="inventory" className="tab-enter"><PlayerInventory characterId={character.id} campaignId={campaignId} /></TabsContent>
          <TabsContent value="chat" className="tab-enter">
            <PlayerChat campaignId={campaignId} currentUserId={currentUserId} isDM={false} />
          </TabsContent>
          {mapId && (
            <TabsContent value="map" className="tab-enter">
              <PlayerMapViewer mapId={mapId} characterId={character.id} />
            </TabsContent>
          )}
        </Tabs>

        <SavePromptListener characterId={character.id} character={character} campaignId={campaignId} />
      </div>
    </div>
  );
};
