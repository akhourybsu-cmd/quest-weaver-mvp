import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Grid, List, Eye, EyeOff, CheckSquare } from "lucide-react";
import EnhancedNPCEditor from "./EnhancedNPCEditor";
import NPCDetailDrawer from "./NPCDetailDrawer";
import NPCFilterPanel, { NPCFilters } from "./NPCFilterPanel";
import NPCQuickActions from "./NPCQuickActions";
import { useToast } from "@/hooks/use-toast";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkVisibilityBar } from "@/components/campaign/BulkVisibilityBar";

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

// Memoized NPC Card Component
const NPCCardItem = memo(({ 
  npc, 
  isDM, 
  campaignId, 
  onView, 
  onUpdate,
  selectionMode,
  isSelected,
  onToggleSelect,
}: { 
  npc: NPC; 
  isDM: boolean; 
  campaignId: string; 
  onView: (npc: NPC) => void;
  onUpdate: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) => (
  <Card
    className="group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-2 border-border/50 hover:border-brand-brass/70 relative overflow-hidden card-glow"
    onClick={() => selectionMode ? onToggleSelect?.(npc.id) : onView(npc)}
  >
    <CardContent className="p-4">
      <div className="flex flex-col items-center text-center relative">
        {selectionMode && (
          <div className="absolute top-0 left-0 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(npc.id)}
            />
          </div>
        )}
        <div className={`absolute top-0 ${selectionMode ? 'left-5' : 'left-0'} w-2 h-2 rounded-full ${getStatusColor(npc.status)}`} />
        {isDM && npc.secrets && (
          <div className="absolute top-0 right-0" title="Has GM secrets">
            <EyeOff className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-brand-brass/70 group-hover:border-brand-brass transition-colors" />
          <Avatar className="w-16 h-16 relative">
            <AvatarImage src={npc.portrait_url} alt={npc.name} />
            <AvatarFallback className="bg-muted">
              {npc.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <h3 className="font-cinzel font-semibold truncate w-full">{npc.name}</h3>
        {npc.role_title && (
          <p className="text-sm text-muted-foreground truncate w-full">{npc.role_title}</p>
        )}
        {npc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {npc.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {npc.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{npc.tags.length - 3}</Badge>
            )}
          </div>
        )}
        {isDM && !selectionMode && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <NPCQuickActions
              npcId={npc.id}
              npcName={npc.name}
              campaignId={campaignId}
              isPinned={npc.is_pinned}
              gmNotes={npc.gm_notes}
              onUpdate={onUpdate}
            />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));

NPCCardItem.displayName = "NPCCardItem";

// Memoized NPC List Item Component
const NPCListItem = memo(({ 
  npc, 
  isDM, 
  campaignId, 
  onView, 
  onUpdate,
  selectionMode,
  isSelected,
  onToggleSelect,
}: { 
  npc: NPC; 
  isDM: boolean; 
  campaignId: string; 
  onView: (npc: NPC) => void;
  onUpdate: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) => (
  <Card
    className="group cursor-pointer hover:shadow-md hover:border-brand-brass/70 transition-all duration-200 border-2 border-border/50"
    onClick={() => selectionMode ? onToggleSelect?.(npc.id) : onView(npc)}
  >
    <CardContent className="flex items-center gap-4 p-4">
      {selectionMode && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(npc.id)}
          />
        </div>
      )}
      <div className={`w-2 h-2 rounded-full ${getStatusColor(npc.status)}`} />
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-2 border-brand-brass/70 group-hover:border-brand-brass transition-colors" />
        <Avatar className="w-12 h-12 relative">
          <AvatarImage src={npc.portrait_url} alt={npc.name} />
          <AvatarFallback className="bg-muted">
            {npc.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-cinzel font-semibold">{npc.name}</h3>
        {npc.role_title && <p className="text-sm text-muted-foreground">{npc.role_title}</p>}
      </div>
      <div className="flex flex-wrap gap-1">
        {npc.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
        {npc.tags.length > 3 && (
          <Badge variant="secondary" className="text-xs">+{npc.tags.length - 3}</Badge>
        )}
      </div>
      {isDM && npc.secrets && (
        <div title="Has GM secrets">
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      {isDM && !selectionMode && (
        <NPCQuickActions
          npcId={npc.id}
          npcName={npc.name}
          campaignId={campaignId}
          isPinned={npc.is_pinned}
          gmNotes={npc.gm_notes}
          onUpdate={onUpdate}
        />
      )}
    </CardContent>
  </Card>
));

NPCListItem.displayName = "NPCListItem";

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
  const bulk = useBulkSelection();

  useEffect(() => {
    localStorage.setItem("npc-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("npc-sort-by", sortBy);
  }, [sortBy]);

  const loadNPCs = useCallback(async () => {
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
  }, [campaignId, toast]);

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
  }, [campaignId, loadNPCs]);

  // Memoized filtered NPCs
  const filteredNPCs = useMemo(() => npcs.filter((npc) => {
    const matchesSearch = searchQuery
      ? npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.role_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesTag = filterTag ? npc.tags.includes(filterTag) : true;
    const matchesFaction = filters.factionId ? npc.faction_id === filters.factionId : true;
    const matchesLocation = filters.locationId ? npc.location_id === filters.locationId : true;
    const matchesStatus = filters.status.length > 0 ? filters.status.includes(npc.status) : true;
    const matchesPinned = filters.showOnlyPinned ? npc.is_pinned : true;

    return matchesSearch && matchesTag && matchesFaction && matchesLocation && matchesStatus && matchesPinned;
  }), [npcs, searchQuery, filterTag, filters]);

  // Memoized sorted NPCs
  const sortedNPCs = useMemo(() => [...filteredNPCs].sort((a, b) => {
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
  }), [filteredNPCs, sortBy]);

  // Memoized pinned/unpinned split
  const { pinnedNPCs, unpinnedNPCs } = useMemo(() => ({
    pinnedNPCs: sortedNPCs.filter((npc) => npc.is_pinned),
    unpinnedNPCs: sortedNPCs.filter((npc) => !npc.is_pinned),
  }), [sortedNPCs]);

  // Memoized all tags
  const allTags = useMemo(() => 
    Array.from(new Set(npcs.flatMap((npc) => npc.tags))), 
    [npcs]
  );

  const handleNewNPC = useCallback(() => {
    setSelectedNPC(null);
    setEditorOpen(true);
  }, []);

  const handleEditNPC = useCallback((npc: NPC) => {
    setSelectedNPC(npc);
    setEditorOpen(true);
  }, []);

  const handleViewNPC = useCallback((npc: NPC) => {
    setSelectedNPC(npc);
    setDetailOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({
      factionId: null,
      locationId: null,
      status: [],
      showOnlyPinned: false,
    });
    setFilterTag(null);
  }, []);

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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={bulk.selectionMode ? "secondary" : "outline"}
                    onClick={bulk.selectionMode ? bulk.exitSelectionMode : bulk.enterSelectionMode}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {bulk.selectionMode ? "Exit Bulk Edit" : "Bulk Edit"}
                  </Button>
                  <Button size="sm" onClick={handleNewNPC}>
                    <Plus className="w-4 h-4 mr-2" />
                    New NPC
                  </Button>
                </div>
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
              <div onClick={(e) => e.stopPropagation()}>
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
              </div>

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
                            {pinnedNPCs.map((npc) => (
                              <NPCCardItem key={npc.id} npc={npc} isDM={isDM} campaignId={campaignId} onView={handleViewNPC} onUpdate={loadNPCs} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(npc.id)} onToggleSelect={bulk.toggleId} />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pinnedNPCs.map((npc) => (
                              <NPCListItem key={npc.id} npc={npc} isDM={isDM} campaignId={campaignId} onView={handleViewNPC} onUpdate={loadNPCs} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(npc.id)} onToggleSelect={bulk.toggleId} />
                            ))}
                          </div>
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
                            {unpinnedNPCs.map((npc) => (
                              <NPCCardItem key={npc.id} npc={npc} isDM={isDM} campaignId={campaignId} onView={handleViewNPC} onUpdate={loadNPCs} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(npc.id)} onToggleSelect={bulk.toggleId} />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {unpinnedNPCs.map((npc) => (
                              <NPCListItem key={npc.id} npc={npc} isDM={isDM} campaignId={campaignId} onView={handleViewNPC} onUpdate={loadNPCs} selectionMode={bulk.selectionMode} isSelected={bulk.selectedIds.includes(npc.id)} onToggleSelect={bulk.toggleId} />
                            ))}
                          </div>
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

      {bulk.selectionMode && (
        <BulkVisibilityBar
          selectedIds={bulk.selectedIds}
          totalCount={sortedNPCs.length}
          onSelectAll={() => bulk.selectAll(sortedNPCs.map((n) => n.id))}
          onDeselectAll={bulk.deselectAll}
          onCancel={bulk.exitSelectionMode}
          tableName="npcs"
          visibilityColumn="player_visible"
          entityLabel="NPCs"
          onUpdated={loadNPCs}
        />
      )}
    </div>
  );
};

export default EnhancedNPCDirectory;
