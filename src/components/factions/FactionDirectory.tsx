import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Shield } from "lucide-react";
import FactionEditor from "./FactionEditor";
import ReputationAdjuster from "./ReputationAdjuster";
import { useToast } from "@/hooks/use-toast";

interface Faction {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  banner_url?: string;
  influence_score: number;
  tags: string[];
}

interface Reputation {
  id: string;
  faction_id: string;
  score: number;
  notes?: string;
}

interface FactionDirectoryProps {
  campaignId: string;
  isDM: boolean;
}

const FactionDirectory = ({ campaignId, isDM }: FactionDirectoryProps) => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [reputations, setReputations] = useState<Reputation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [reputationOpen, setReputationOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFactions();
    loadReputations();

    const factionsChannel = supabase
      .channel(`factions:${campaignId}`)
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

    const repChannel = supabase
      .channel(`faction_reputation:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "faction_reputation",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadReputations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(factionsChannel);
      supabase.removeChannel(repChannel);
    };
  }, [campaignId]);

  const loadFactions = async () => {
    const { data, error } = await supabase
      .from("factions")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    if (error) {
      toast({
        title: "Error loading factions",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFactions((data || []) as Faction[]);
  };

  const loadReputations = async () => {
    const { data } = await supabase
      .from("faction_reputation")
      .select("*")
      .eq("campaign_id", campaignId);

    setReputations((data || []) as Reputation[]);
  };

  const getReputation = (factionId: string) => {
    return reputations.find((r) => r.faction_id === factionId);
  };

  const getReputationColor = (score: number) => {
    if (score >= 50) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 20) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score >= -20) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    if (score >= -50) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const filteredFactions = factions.filter((faction) =>
    searchQuery
      ? faction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faction.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const handleNewFaction = () => {
    setSelectedFaction(null);
    setEditorOpen(true);
  };

  const handleEditFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    setEditorOpen(true);
  };

  const handleAdjustReputation = (faction: Faction) => {
    setSelectedFaction(faction);
    setReputationOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Factions
            </CardTitle>
            {isDM && (
              <Button size="sm" onClick={handleNewFaction}>
                <Plus className="w-4 h-4 mr-2" />
                New Faction
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
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
              <p>No factions yet</p>
              {isDM && (
                <Button variant="outline" size="sm" className="mt-2" onClick={handleNewFaction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first faction
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFactions.map((faction) => {
                const reputation = getReputation(faction.id);
                const score = reputation?.score || 0;

                return (
                  <Card
                    key={faction.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
                    onClick={() => handleEditFaction(faction)}
                  >
                    {/* Background Banner with Overlay */}
                    {faction.banner_url && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{ backgroundImage: `url(${faction.banner_url})` }}
                      />
                    )}
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        {/* Faction Emblem/Banner Thumbnail */}
                        {faction.banner_url && (
                          <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-brass/20">
                            <img 
                              src={faction.banner_url} 
                              alt={faction.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold flex items-center gap-2">
                            {faction.name}
                            {reputation && (
                              <Badge
                                variant="outline"
                                className={getReputationColor(score)}
                              >
                                {score > 0 ? "+" : ""}
                                {score}
                              </Badge>
                            )}
                          </h3>
                          {faction.motto && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              "{faction.motto}"
                            </p>
                          )}
                          {faction.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {faction.description}
                            </p>
                          )}
                          {faction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {faction.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {isDM && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdjustReputation(faction);
                            }}
                          >
                            Reputation
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FactionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId}
        faction={selectedFaction}
        onSaved={loadFactions}
      />

      {selectedFaction && (
        <ReputationAdjuster
          open={reputationOpen}
          onOpenChange={setReputationOpen}
          campaignId={campaignId}
          faction={selectedFaction}
          currentReputation={getReputation(selectedFaction.id)}
          onSaved={loadReputations}
        />
      )}
    </>
  );
};

export default FactionDirectory;
