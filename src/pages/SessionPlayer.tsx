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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Zap, Plus, Minus, Dices } from "lucide-react";
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

interface Effect {
  id: string;
  name: string;
  description: string | null;
  end_round: number | null;
}

const SessionPlayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignCode = searchParams.get("campaign");
  const { toast } = useToast();

  const [character, setCharacter] = useState<Character | null>(null);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(true);
  const [hpAdjustment, setHpAdjustment] = useState("");
  const [tempHpValue, setTempHpValue] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignCode) {
      navigate("/campaign-hub");
      return;
    }

    fetchCharacter();
  }, [campaignCode, navigate]);

  useEffect(() => {
    if (!character) return;

    fetchEffects();

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

    // Subscribe to effects changes
    const effectsChannel = supabase
      .channel('effects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `character_id=eq.${character.id}`,
        },
        () => fetchEffects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(characterChannel);
      supabase.removeChannel(effectsChannel);
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
      toast({
        title: "No character found",
        description: "Please create a character first",
        variant: "destructive",
      });
      navigate("/campaign-hub");
      return;
    }

    setCharacter(data);

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

  const fetchEffects = async () => {
    if (!character) return;

    const { data } = await supabase
      .from("effects")
      .select("id, name, description, end_round")
      .eq("character_id", character.id);

    setEffects(data || []);
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

  const getHPColor = () => {
    const percentage = getHPPercentage();
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
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
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm" role="banner">
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
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4" role="main">
        {/* Player Presence */}
        {campaignId && currentUserId && (
          <PlayerPresence
            campaignId={campaignId}
            currentUserId={currentUserId}
            isDM={false}
          />
        )}

        {/* Player Character Sheet - shown when in active encounter */}
        {activeEncounter && campaignId && (
          <PlayerCharacterSheet
            characterId={character.id}
            campaignId={campaignId}
            encounterId={activeEncounter}
          />
        )}

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
                <span className="text-2xl sm:text-3xl font-bold tabular-nums" aria-label={`Current hit points: ${character.current_hp}`}>
                  {character.current_hp}
                </span>
                <span className="text-lg sm:text-xl text-muted-foreground" aria-label={`Maximum hit points: ${character.max_hp}`}>
                  / {character.max_hp}
                </span>
              </div>
              <Progress value={getHPPercentage()} className="h-3" aria-label={`Hit points: ${Math.round(getHPPercentage())}% remaining`} />
            </div>

            {character.temp_hp > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-secondary/10 border-secondary">
                  +{character.temp_hp} Temporary HP
                </Badge>
              </div>
            )}

            {/* HP Adjustment */}
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1" aria-label="Apply damage to character">
                    <Minus className="w-4 h-4 mr-1" aria-hidden="true" />
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
                  <Button variant="outline" size="sm" className="flex-1" aria-label="Apply healing to character">
                    <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
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
                  <Button variant="outline" size="sm" className="flex-1" aria-label="Add temporary hit points">
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
                <div className="text-xs text-muted-foreground">Armor Class</div>
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
                <div className="text-xs text-muted-foreground">Speed (ft)</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saving Throw Listener */}
        {campaignId && (
          <SavePromptListener
            characterId={character.id}
            character={character}
            campaignId={campaignId}
          />
        )}

        {/* Active Effects */}
        {effects.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Active Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {effects.map((effect) => (
                <div
                  key={effect.id}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="font-semibold">{effect.name}</div>
                  {effect.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {effect.description}
                    </div>
                  )}
                  {effect.end_round && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Ends: Round {effect.end_round}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Rest Manager */}
        <RestManager character={character} />

        {/* Dice Roller */}
        <DiceRoller />
      </main>

      <BottomNav role="player" />
    </div>
  );
};

export default SessionPlayer;
