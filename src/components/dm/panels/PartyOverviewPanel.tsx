import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Eye, Users } from "lucide-react";
import { PartyRestManager } from "@/components/combat/PartyRestManager";
import DamageInput from "@/components/combat/DamageInput";
import DeathSaveTracker from "@/components/combat/DeathSaveTracker";

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
  death_save_success: number;
  death_save_fail: number;
  inspiration: boolean;
}

export const PartyOverviewPanel: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
    
    const channel = supabase
      .channel(`party-panel:${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchCharacters())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  const fetchCharacters = async () => {
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");
    if (data) setCharacters(data);
  };

  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{characters.length}</div>
              <div className="text-xs text-muted-foreground">Party</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Math.round(characters.reduce((sum, c) => sum + c.current_hp, 0) / characters.length) || 0}
              </div>
              <div className="text-xs text-muted-foreground">Avg HP</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PartyRestManager campaignId={campaignId} characters={characters} />

      <div className="flex-1 overflow-auto space-y-2">
        {characters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No characters yet</p>
          </div>
        ) : (
          characters.map((character) => (
            <div
              key={character.id}
              className="bg-card rounded-lg p-3 space-y-2 border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedCharacterId(character.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{character.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Lvl {character.level} {character.class}
                  </p>
                </div>
                {character.inspiration && (
                  <Badge variant="secondary" className="text-xs">⭐</Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>HP</span>
                    {character.temp_hp > 0 && (
                      <Badge variant="outline" className="text-xs ml-1">+{character.temp_hp}</Badge>
                    )}
                  </div>
                  <span className="font-semibold">
                    {character.current_hp} / {character.max_hp}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getHPColor(character.current_hp, character.max_hp)}`}
                    style={{ width: `${Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>{character.ac}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{character.passive_perception}</span>
                </div>
              </div>

              {character.current_hp === 0 && (
                <DeathSaveTracker 
                  characterId={character.id}
                  characterName={character.name}
                  successes={character.death_save_success}
                  failures={character.death_save_fail}
                  currentHp={character.current_hp}
                  encounterId=""
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
