import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Shield, Quote, Target, TrendingUp, TrendingDown, Book, CheckSquare } from "lucide-react";
import FactionEditor from "./FactionEditor";
import ReputationAdjuster from "./ReputationAdjuster";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkVisibilityBar } from "@/components/campaign/BulkVisibilityBar";

interface Faction {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  banner_url?: string;
  influence_score: number;
  tags: string[];
  goals?: string[];
  lore_page_id?: string;
}

interface Reputation {
  id: string;
  faction_id: string;
  score: number;
  notes?: string;
}

interface LorePage {
  id: string;
  title: string;
  content_md: string;
  category: string;
  visibility: string;
  tags?: string[];
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkedLore, setLinkedLore] = useState<LorePage | null>(null);
  const { toast } = useToast();
  const bulk = useBulkSelection();

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
    if (score >= 50) return "text-emerald-400";
    if (score >= 0) return "text-amber-400";
    return "text-red-400";
  };

  const getReputationLabel = (score: number) => {
    if (score >= 75) return "Revered";
    if (score >= 50) return "Friendly";
    if (score >= 25) return "Warm";
    if (score >= -25) return "Neutral";
    if (score >= -50) return "Unfriendly";
    if (score >= -75) return "Hostile";
    return "Hated";
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

  const handleViewFaction = async (faction: Faction) => {
    setSelectedFaction(faction);
    setLinkedLore(null);
    setDetailOpen(true);
    
    // Load linked lore page if exists
    if (faction.lore_page_id) {
      const { data } = await supabase
        .from("lore_pages")
        .select("*")
        .eq("id", faction.lore_page_id)
        .single();
      
      if (data) {
        setLinkedLore(data as LorePage);
      }
    }
  };

  const handleAdjustReputation = (faction: Faction, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFaction(faction);
    setReputationOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            <h2 className="text-xl font-cinzel text-brass">Factions ({factions.length})</h2>
          </div>
          {isDM && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={bulk.selectionMode ? "secondary" : "outline"}
                onClick={bulk.selectionMode ? bulk.exitSelectionMode : bulk.enterSelectionMode}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {bulk.selectionMode ? "Exit" : "Bulk Edit"}
              </Button>
              <Button size="sm" onClick={handleNewFaction}>
                <Plus className="w-4 h-4 mr-2" />
                New Faction
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search factions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-brass/20"
          />
        </div>

        {/* Factions Grid */}
        {filteredFactions.length === 0 ? (
          <Card className="border-brass/20 bg-card/50">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No factions yet</p>
              {isDM && (
                <Button variant="outline" size="sm" className="mt-2" onClick={handleNewFaction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first faction
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFactions.map((faction) => {
              const reputation = getReputation(faction.id);
              const score = reputation?.score || 0;

              return (
                <Card
                  key={faction.id}
                  className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer overflow-hidden relative"
                  onClick={() => bulk.selectionMode ? bulk.toggleId(faction.id) : handleViewFaction(faction)}
                >
                  {bulk.selectionMode && (
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={bulk.selectedIds.includes(faction.id)} onCheckedChange={() => bulk.toggleId(faction.id)} />
                    </div>
                  )}
                  {/* Banner Image */}
                  {faction.banner_url && (
                    <div className="relative w-full h-24 overflow-hidden">
                      <img
                        src={faction.banner_url}
                        alt={faction.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                  )}
                  
                  <CardHeader className={faction.banner_url ? "pt-2" : ""}>
                    <CardTitle className="font-cinzel">{faction.name}</CardTitle>
                    {faction.motto && (
                      <p className="text-xs italic text-muted-foreground flex items-center gap-1">
                        <Quote className="w-3 h-3" />
                        "{faction.motto}"
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {faction.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{faction.description}</p>
                    )}
                    
                    {/* Reputation Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Reputation</span>
                        <span className={getReputationColor(score)}>
                          {getReputationLabel(score)}
                        </span>
                      </div>
                      <Progress 
                        value={(score + 100) / 2} 
                        className="h-2"
                      />
                    </div>

                    {/* Influence Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Influence</span>
                        <span>{faction.influence_score}%</span>
                      </div>
                      <Progress value={faction.influence_score} className="h-2" />
                    </div>

                    {/* Tags */}
                    {faction.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {faction.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* DM Reputation Button */}
                    {isDM && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={(e) => handleAdjustReputation(faction, e)}
                      >
                        Adjust Reputation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Faction Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedFaction && (
            <>
              <DialogHeader>
                {selectedFaction.banner_url && (
                  <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
                    <img
                      src={selectedFaction.banner_url}
                      alt={selectedFaction.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <DialogTitle className="font-cinzel text-xl">{selectedFaction.name}</DialogTitle>
                {selectedFaction.motto && (
                  <p className="text-sm italic text-muted-foreground">"{selectedFaction.motto}"</p>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {selectedFaction.description && (
                  <p className="text-muted-foreground">{selectedFaction.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-brass flex items-center gap-2">
                      {(getReputation(selectedFaction.id)?.score || 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      Reputation
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={getReputationColor(getReputation(selectedFaction.id)?.score || 0)}>
                          {getReputationLabel(getReputation(selectedFaction.id)?.score || 0)}
                        </span>
                        <span className="text-muted-foreground">{getReputation(selectedFaction.id)?.score || 0}</span>
                      </div>
                      <Progress value={((getReputation(selectedFaction.id)?.score || 0) + 100) / 2} className="h-3" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-brass">Influence</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{selectedFaction.influence_score}%</span>
                      </div>
                      <Progress value={selectedFaction.influence_score} className="h-3" />
                    </div>
                  </div>
                </div>

                {/* Goals */}
                {selectedFaction.goals && selectedFaction.goals.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-brass mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Goals
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {selectedFaction.goals.map((goal, idx) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {selectedFaction.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedFaction.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Linked Lore Content */}
                {linkedLore && (
                  <div className="space-y-2 pt-4 border-t border-brass/20">
                    <h4 className="font-semibold text-brass flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Lore
                    </h4>
                    <ScrollArea className="h-48 rounded-lg border border-brass/20 bg-muted/30 p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {linkedLore.content_md || "*No lore content*"}
                        </ReactMarkdown>
                      </div>
                    </ScrollArea>
                    {linkedLore.tags && linkedLore.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {linkedLore.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DM Actions */}
                {isDM && (
                  <div className="flex gap-2 pt-4 border-t border-brass/20">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailOpen(false);
                        handleEditFaction(selectedFaction);
                      }}
                    >
                      Edit Faction
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        setDetailOpen(false);
                        handleAdjustReputation(selectedFaction, e as any);
                      }}
                    >
                      Adjust Reputation
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

      {bulk.selectionMode && (
        <BulkVisibilityBar
          selectedIds={bulk.selectedIds}
          totalCount={filteredFactions.length}
          onSelectAll={() => bulk.selectAll(filteredFactions.map((f) => f.id))}
          onDeselectAll={bulk.deselectAll}
          onCancel={bulk.exitSelectionMode}
          tableName="factions"
          visibilityColumn="player_visible"
          entityLabel="factions"
          onUpdated={loadFactions}
        />
      )}
    </>
  );
};

export default FactionDirectory;
