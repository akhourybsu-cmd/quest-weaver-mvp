import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ResourceTracker } from "./ResourceTracker";
import { calculateCharacterResources } from "@/lib/resourceCalculator";

interface Condition {
  id: string;
  condition: string;
  ends_at_round: number | null;
}

interface Effect {
  id: string;
  name: string;
  description: string | null;
  end_round: number | null;
}

interface PlayerCharacterSheetProps {
  characterId: string;
  campaignId: string;
  encounterId: string | null;
}

export function PlayerCharacterSheet({
  characterId,
  campaignId,
  encounterId,
}: PlayerCharacterSheetProps) {
  const { toast } = useToast();
  const [character, setCharacter] = useState<any>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [needsRuling, setNeedsRuling] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);

  useEffect(() => {
    fetchCharacter();
    if (encounterId) {
      fetchConditions();
      fetchEffects();
      fetchEncounter();
      subscribeToUpdates();
    }
  }, [characterId, encounterId]);

  const fetchCharacter = async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (data) {
      // Auto-populate resources if missing or empty
      const currentResources = (data.resources as any) || {};
      const hasResources = currentResources.spellSlots?.length > 0 || currentResources.classResources?.length > 0;
      
      if (!hasResources && data.creation_status === 'complete') {
        const autoResources = calculateCharacterResources(data.class, data.level);
        await supabase
          .from("characters")
          .update({ resources: autoResources as any })
          .eq("id", characterId);
        
        setCharacter({ ...data, resources: autoResources });
      } else {
        setCharacter(data);
      }
    }
  };

  const fetchConditions = async () => {
    if (!encounterId) return;
    
    const { data } = await supabase
      .from('character_conditions')
      .select('*')
      .eq('character_id', characterId)
      .eq('encounter_id', encounterId);

    if (data) setConditions(data);
  };

  const fetchEffects = async () => {
    if (!encounterId) return;

    const { data } = await supabase
      .from('effects')
      .select('*')
      .eq('character_id', characterId)
      .eq('encounter_id', encounterId);

    if (data) setEffects(data);
  };

  const fetchEncounter = async () => {
    if (!encounterId) return;

    const { data } = await supabase
      .from('encounters')
      .select('current_round')
      .eq('id', encounterId)
      .single();

    if (data) setCurrentRound(data.current_round);
  };

  const subscribeToUpdates = () => {
    if (!encounterId) return;

    const channel = supabase
      .channel(`player-updates-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        () => fetchCharacter()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_conditions',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchConditions()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchEffects()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounterId}`,
        },
        () => fetchEncounter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleNeedRuling = async () => {
    const newValue = !needsRuling;
    
    const { error } = await supabase
      .from('player_presence')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        campaign_id: campaignId,
        character_id: characterId,
        needs_ruling: newValue,
        last_seen: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to signal DM",
        variant: "destructive",
      });
    } else {
      setNeedsRuling(newValue);
      toast({
        title: newValue ? "DM Notified" : "Signal Cleared",
        description: newValue 
          ? "The DM has been notified you need a ruling" 
          : "Ruling signal cleared",
      });
    }
  };

  if (!character) return null;

  const hpPercent = (character.current_hp / character.max_hp) * 100;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{character.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Level {character.level} {character.class}
              </p>
            </div>
            <Button
              onClick={toggleNeedRuling}
              variant={needsRuling ? "destructive" : "outline"}
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {needsRuling ? "Ruling Requested" : "Need Ruling"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* HP Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-semibold">Hit Points</span>
              </div>
              <span className="text-lg font-bold">
                {character.current_hp} / {character.max_hp}
              </span>
            </div>
            <Progress value={hpPercent} className="h-3" />
            {character.temp_hp > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{character.temp_hp} Temp HP
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <div>
                <p className="text-xs text-muted-foreground">AC</p>
                <p className="text-lg font-bold">{character.ac}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <div>
                <p className="text-xs text-muted-foreground">Initiative</p>
                <p className="text-lg font-bold">+{character.initiative_bonus}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-lg font-bold">{character.speed} ft</p>
            </div>
          </div>

          {/* Current Round (if in encounter) */}
          {encounterId && currentRound > 0 && (
            <Badge variant="outline" className="w-full justify-center">
              Round {currentRound}
            </Badge>
          )}

          {/* Conditions */}
          {conditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Active Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition) => (
                  <Badge key={condition.id} variant="destructive" className="text-xs">
                    {condition.condition}
                    {condition.ends_at_round && ` (ends round ${condition.ends_at_round})`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Effects */}
          {effects.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Active Effects</h4>
              <div className="space-y-2">
                {effects.map((effect) => (
                  <div key={effect.id} className="p-2 bg-muted/50 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{effect.name}</span>
                      {effect.end_round && (
                        <Badge variant="outline" className="text-xs">
                          Until round {effect.end_round}
                        </Badge>
                      )}
                    </div>
                    {effect.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {effect.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Tracker */}
      <ResourceTracker
        characterId={character.id}
        characterName={character.name}
        resources={character.resources as any || {}}
        canEdit={true}
      />
    </div>
  );
}
