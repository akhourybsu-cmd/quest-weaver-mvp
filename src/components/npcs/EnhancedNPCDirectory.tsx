import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Grid, List, Eye, EyeOff } from "lucide-react";
import EnhancedNPCEditor from "./EnhancedNPCEditor";
import NPCDetailDrawer from "./NPCDetailDrawer";
import NPCFilterPanel, { NPCFilters } from "./NPCFilterPanel";
import NPCQuickActions from "./NPCQuickActions";
import { useToast } from "@/hooks/use-toast";

interface NPC {
  id: string;
  name: string;
  pronouns?: string;
  role_title?: string;
  public_bio?: string;
  gm_notes?: string;
  secrets?: string;
  portrait_url?: string;
  location_id?: string;
  faction_id?: string;
  tags: string[];
  is_pinned: boolean;
  status: string;
  alignment?: string;
  created_at: string;
  updated_at: string;
}

interface EnhancedNPCDirectoryProps {
  campaignId: string;
  isDM: boolean;
}

const EnhancedNPCDirectory = ({ campaignId, isDM }: EnhancedNPCDirectoryProps) => {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("npc-view-mode") as "grid" | "list") || "grid"
  );
  const [sortBy, setSortBy] = useState<string>(
    () => localStorage.getItem("npc-sort-by") || "name"
  );
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filters, setFilters] = useState<NPCFilters>({
    factionId: null,
    locationId: null,
    status: [],
    showOnlyPinned: false,
  });
  const { toast } = useToast();

  // Persist view mode and sort preference
  useEffect(() => {
    localStorage.setItem("npc-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("npc-sort-by", sortBy);
  }, [sortBy]);

  useEffect(() => {
    loadNPCs();

    const channel = supabase
      .channel(`npcs:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "npcs",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadNPCs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadNPCs = async () => {
    const { data, error } = await supabase
      .from("npcs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    if (error) {
      toast({
        title: "Error loading NPCs",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNpcs((data || []) as NPC[]);
  };

  const filteredNPCs = npcs.filter((npc) => {
    const matchesSearch = searchQuery
      ? npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.role_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesTag = filterTag ? npc.tags.includes(filterTag) : true;
    const matchesFaction = filters.factionId ? npc.faction_id === filters.factionId : true;
    const matchesLocation = filters.locationId ? npc.location_id === filters.locationId : true;
    const matchesStatus =
      filters.status.length > 0 ? filters.status.includes(npc.status) : true;
    const matchesPinned = filters.showOnlyPinned ? npc.is_pinned : true;

    return (
      matchesSearch &&
      matchesTag &&
      matchesFaction &&
      matchesLocation &&
      matchesStatus &&
      matchesPinned
    );
  });

  // Sort NPCs
  const sortedNPCs = [...filteredNPCs].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "updated":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "faction":
        return (a.faction_id || "").localeCompare(b.faction_id || "");
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Split into pinned and unpinned
  const pinnedNPCs = sortedNPCs.filter((npc) => npc.is_pinned);
  const unpinnedNPCs = sortedNPCs.filter((npc) => !npc.is_pinned);

  const allTags = Array.from(new Set(npcs.flatMap((npc) => npc.tags)));

  const handleNewNPC = () => {
    setSelectedNPC(null);
    setEditorOpen(true);
  };

  const handleEditNPC = (npc: NPC) => {
    setSelectedNPC(npc);
    setEditorOpen(true);
  };

  const handleViewNPC = (npc: NPC) => {
    setSelectedNPC(npc);
    setDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alive":
        return "bg-status-buff";
      case "dead":
        return "bg-muted-foreground";
      case "missing":
        return "bg-status-warning";
      default:
        return "bg-muted";
    }
  };

  const renderNPCCard = (npc: NPC) => (
    <Card
      key={npc.id}
      className="group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-2 border-border/50 hover:border-brand-brass/70 relative overflow-hidden"
      onClick={() => handleViewNPC(npc)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center relative">
          {/* Status Indicator */}
          <div
            className={`absolute top-0 left-0 w-2 h-2 rounded-full ${getStatusColor(
              npc.status
            )}`}
          />

          {/* GM-only Badge */}
          {isDM && npc.secrets && (
            <div className="absolute top-0 right-0" title="Has GM secrets">
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            </div>
          )}

          {/* Avatar with brass ring */}
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-brand-brass/70 group-hover:border-brand-brass transition-colors" />
            <Avatar className="w-16 h-16 relative">
              <AvatarImage src={npc.portrait_url} alt={npc.name} />
              <AvatarFallback className="bg-muted">
                {npc.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <h3 className="font-cinzel font-semibold truncate w-full">{npc.name}</h3>
          {npc.role_title && (
            <p className="text-sm text-muted-foreground truncate w-full">{npc.role_title}</p>
          )}

          {/* Tags */}
          {npc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {npc.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {npc.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{npc.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Quick Actions - Show on hover */}
          {isDM && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <NPCQuickActions
                npcId={npc.id}
                npcName={npc.name}
                campaignId={campaignId}
                isPinned={npc.is_pinned}
                gmNotes={npc.gm_notes}
                onUpdate={loadNPCs}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderNPCListItem = (npc: NPC) => (
    <Card
      key={npc.id}
      className="group cursor-pointer hover:shadow-md hover:border-brand-brass/70 transition-all duration-200 border-2 border-border/50"
      onClick={() => handleViewNPC(npc)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Status Indicator */}
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(npc.status)}`}
        />

        {/* Avatar with brass ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-2 border-brand-brass/70 group-hover:border-brand-brass transition-colors" />
          <Avatar className="w-12 h-12 relative">
            <AvatarImage src={npc.portrait_url} alt={npc.name} />
            <AvatarFallback className="bg-muted">
              {npc.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-cinzel font-semibold">{npc.name}</h3>
          {npc.role_title && <p className="text-sm text-muted-foreground">{npc.role_title}</p>}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {npc.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {npc.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{npc.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* GM Secrets Badge */}
        {isDM && npc.secrets && (
          <div title="Has GM secrets">
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* Quick Actions */}
        {isDM && (
          <NPCQuickActions
            npcId={npc.id}
            npcName={npc.name}
            campaignId={campaignId}
            isPinned={npc.is_pinned}
            gmNotes={npc.gm_notes}
            onUpdate={loadNPCs}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex gap-4">
      {/* Filter Panel */}
      {isDM && (
        <NPCFilterPanel
          campaignId={campaignId}
          onFilterChange={setFilters}
          currentFilters={filters}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-cinzel">
                <Users className="w-5 h-5" />
                NPC Directory
              </CardTitle>
              {isDM && (
                <Button size="sm" onClick={handleNewNPC}>
                  <Plus className="w-4 h-4 mr-2" />
                  New NPC
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              {/* Mobile Filter Button */}
              {isDM && (
                <div className="md:hidden">
                  <NPCFilterPanel
                    campaignId={campaignId}
                    onFilterChange={setFilters}
                    currentFilters={filters}
                  />
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search NPCs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="faction">Faction</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={filterTag || "all"}
              onValueChange={(v) => setFilterTag(v === "all" ? null : v)}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({npcs.length})</TabsTrigger>
                {allTags.slice(0, 4).map((tag) => (
                  <TabsTrigger key={tag} value={tag}>
                    {tag}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={filterTag || "all"}>
                {sortedNPCs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery || filters.showOnlyPinned ? (
                      <>
                        <p>No NPCs match your filters</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSearchQuery("");
                            setFilters({
                              factionId: null,
                              locationId: null,
                              status: [],
                              showOnlyPinned: false,
                            });
                            setFilterTag(null);
                          }}
                        >
                          Clear filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>No NPCs yet</p>
                        {isDM && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={handleNewNPC}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create your first NPC
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Pinned Section */}
                    {pinnedNPCs.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-brand-brass/30">
                          <h3 className="font-cinzel font-semibold text-sm text-brand-brass">
                            Pinned NPCs
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {pinnedNPCs.length}
                          </Badge>
                        </div>
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pinnedNPCs.map(renderNPCCard)}
                          </div>
                        ) : (
                          <div className="space-y-2">{pinnedNPCs.map(renderNPCListItem)}</div>
                        )}
                      </div>
                    )}

                    {/* All NPCs Section */}
                    {unpinnedNPCs.length > 0 && (
                      <>
                        {pinnedNPCs.length > 0 && (
                          <h3 className="font-cinzel font-semibold text-sm mb-3">All NPCs</h3>
                        )}
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {unpinnedNPCs.map(renderNPCCard)}
                          </div>
                        ) : (
                          <div className="space-y-2">{unpinnedNPCs.map(renderNPCListItem)}</div>
                        )}
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <EnhancedNPCEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId}
        npc={selectedNPC}
        onSaved={loadNPCs}
      />

      {selectedNPC && (
        <NPCDetailDrawer
          open={detailOpen}
          onOpenChange={setDetailOpen}
          npc={selectedNPC}
          campaignId={campaignId}
          isDM={isDM}
          onEdit={() => {
            setDetailOpen(false);
            handleEditNPC(selectedNPC);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedNPCDirectory;
