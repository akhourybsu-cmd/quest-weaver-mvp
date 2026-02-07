import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Search, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Faction {
  id: string;
  name: string;
  description: string | null;
  motto: string | null;
  banner_url: string | null;
  influence_score: number | null;
  tags: string[];
  goals: string[];
}

interface PlayerFactionsViewProps {
  campaignId: string;
}

export function PlayerFactionsView({ campaignId }: PlayerFactionsViewProps) {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadFactions();

    const channel = supabase
      .channel(`player-factions:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "factions",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadFactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadFactions = async () => {
    const { data, error } = await supabase
      .from("factions")
      .select("id, name, description, motto, banner_url, influence_score, tags, goals")
      .eq("campaign_id", campaignId)
      .eq("player_visible", true)
      .order("name");

    if (!error && data) {
      setFactions(data as Faction[]);
    }
  };

  const filteredFactions = factions.filter((faction) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      faction.name.toLowerCase().includes(search) ||
      faction.description?.toLowerCase().includes(search) ||
      faction.tags?.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  const handleViewFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    setDialogOpen(true);
  };

  const getInfluenceLabel = (score: number | null) => {
    if (score === null) return "Unknown";
    if (score >= 80) return "Dominant";
    if (score >= 60) return "Strong";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Minor";
    return "Negligible";
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {selectedFaction?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedFaction && (
            <div className="space-y-4">
              {selectedFaction.banner_url && (
                <div className="rounded-lg overflow-hidden border border-brass/20">
                  <img
                    src={selectedFaction.banner_url}
                    alt={selectedFaction.name}
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}

              {selectedFaction.motto && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motto</p>
                  <p className="text-sm italic">"{selectedFaction.motto}"</p>
                </div>
              )}

              {selectedFaction.influence_score !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Influence</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${selectedFaction.influence_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getInfluenceLabel(selectedFaction.influence_score)}
                    </span>
                  </div>
                </div>
              )}

              {selectedFaction.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedFaction.description}</p>
                </div>
              )}

              {selectedFaction.goals && selectedFaction.goals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Known Goals</p>
                  <ul className="space-y-1">
                    {selectedFaction.goals.map((goal, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Target className="w-3 h-3 mt-1 text-primary shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedFaction.tags && selectedFaction.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFaction.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-brass/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 font-cinzel">
              <Shield className="w-5 h-5" />
              Known Factions
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search factions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredFactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No factions revealed yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFactions.map((faction) => (
                  <Card
                    key={faction.id}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all border-brass/20 relative overflow-hidden"
                    onClick={() => handleViewFaction(faction)}
                  >
                    {faction.banner_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${faction.banner_url})` }}
                      />
                    )}
                    <div className={`absolute inset-0 ${faction.banner_url ? 'bg-card/85 backdrop-blur-[2px]' : ''}`} />

                    <CardContent className="p-4 space-y-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-cinzel font-semibold truncate">{faction.name}</h3>
                      </div>
                      {faction.motto && (
                        <p className="text-xs text-muted-foreground italic">"{faction.motto}"</p>
                      )}
                      {faction.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faction.description}
                        </p>
                      )}
                      {faction.influence_score !== null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full"
                              style={{ width: `${faction.influence_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getInfluenceLabel(faction.influence_score)}
                          </span>
                        </div>
                      )}
                      {faction.tags && faction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {faction.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-brass/30">
                              {tag}
                            </Badge>
                          ))}
                          {faction.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{faction.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
