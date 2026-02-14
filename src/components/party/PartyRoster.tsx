import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Users, Shield, Heart, Eye, Brain, Search as SearchIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PartyCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  ac: number;
  current_hp: number;
  max_hp: number;
  passive_perception: number | null;
  passive_insight: number | null;
  passive_investigation: number | null;
  inspiration: boolean | null;
  speed: number | null;
  user_id: string;
  languages: { name: string }[];
}

interface PartyRosterProps {
  campaignId: string;
}

export function PartyRoster({ campaignId }: PartyRosterProps) {
  const [characters, setCharacters] = useState<PartyCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPartyCharacters();
  }, [campaignId]);

  const fetchPartyCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, class, level, ac, current_hp, max_hp, passive_perception, passive_insight, passive_investigation, inspiration, speed, user_id")
        .eq("campaign_id", campaignId)
        .not("user_id", "is", null);

      if (error) throw error;

      // Fetch languages for each character
      const charIds = (data || []).map(c => c.id);
      const { data: langData } = await supabase
        .from("character_languages")
        .select("character_id, name")
        .in("character_id", charIds.length > 0 ? charIds : ["__none__"]);

      const langMap = new Map<string, { name: string }[]>();
      (langData || []).forEach(l => {
        if (!langMap.has(l.character_id)) langMap.set(l.character_id, []);
        langMap.get(l.character_id)!.push({ name: l.name });
      });

      setCharacters((data || []).map(c => ({
        ...c,
        languages: langMap.get(c.id) || [],
      })));
    } catch (error: any) {
      console.error("Failed to fetch party:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInspiration = async (charId: string, current: boolean | null) => {
    const newValue = !current;
    try {
      const { error } = await supabase
        .from("characters")
        .update({ inspiration: newValue })
        .eq("id", charId);
      if (error) throw error;
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, inspiration: newValue } : c));
      toast({ title: newValue ? "Inspiration granted!" : "Inspiration removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading party...</div>;
  }

  if (characters.length === 0) {
    return (
      <Card className="border-brass/20">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-brass/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No player characters in this campaign yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Players need to join and assign characters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-arcanePurple" />
        <h3 className="font-cinzel font-bold text-lg">Party Roster</h3>
        <Badge variant="outline" className="border-brass/30 text-brass ml-auto">
          {characters.length} PC{characters.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid gap-3">
        {characters.map((char) => {
          const hpPercent = char.max_hp > 0 ? (char.current_hp / char.max_hp) * 100 : 0;
          const hpColor = hpPercent > 50 ? "bg-green-500" : hpPercent > 25 ? "bg-yellow-500" : "bg-red-500";

          return (
            <Card key={char.id} className="border-brass/20 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Name + Class */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-cinzel font-bold text-ink truncate">{char.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Level {char.level} {char.class}
                    </p>
                  </div>

                  {/* Inspiration toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Sparkles className={`w-4 h-4 ${char.inspiration ? "text-yellow-400" : "text-brass/30"}`} />
                    <Switch
                      checked={!!char.inspiration}
                      onCheckedChange={() => toggleInspiration(char.id, char.inspiration)}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1" title="Armor Class">
                    <Shield className="w-3.5 h-3.5 text-brass" />
                    <span className="font-semibold">{char.ac}</span>
                  </div>

                  <div className="flex items-center gap-1.5" title="Hit Points">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{char.current_hp}/{char.max_hp}</span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${hpColor} rounded-full transition-all`} style={{ width: `${hpPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  {char.speed && (
                    <span className="text-muted-foreground">{char.speed} ft</span>
                  )}
                </div>

                {/* Passives row */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1" title="Passive Perception">
                    <Eye className="w-3 h-3" />
                    <span>PP {char.passive_perception ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Passive Insight">
                    <Brain className="w-3 h-3" />
                    <span>PI {char.passive_insight ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Passive Investigation">
                    <SearchIcon className="w-3 h-3" />
                    <span>PIv {char.passive_investigation ?? "—"}</span>
                  </div>
                </div>

                {/* Languages */}
                {char.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {char.languages.map((l, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-brass/20 text-brass/80">
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
