import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Users, Grid, List } from "lucide-react";
import EnhancedNPCEditor from "./EnhancedNPCEditor";
import NPCDetailDrawer from "./NPCDetailDrawer";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { toast } = useToast();

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

    return matchesSearch && matchesTag;
  });

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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search NPCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          <Tabs value={filterTag || "all"} onValueChange={(v) => setFilterTag(v === "all" ? null : v)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({npcs.length})</TabsTrigger>
              {allTags.slice(0, 4).map((tag) => (
                <TabsTrigger key={tag} value={tag}>
                  {tag}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={filterTag || "all"}>
              {filteredNPCs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No NPCs found</p>
                  {isDM && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleNewNPC}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first NPC
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredNPCs.map((npc) => (
                    <Card
                      key={npc.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleViewNPC(npc)}
                    >
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-2">
                          <AvatarImage src={npc.portrait_url} alt={npc.name} />
                          <AvatarFallback>
                            {npc.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold truncate">{npc.name}</h3>
                        {npc.role_title && (
                          <p className="text-sm text-muted-foreground truncate">{npc.role_title}</p>
                        )}
                        {npc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 justify-center">
                            {npc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNPCs.map((npc) => (
                    <Card
                      key={npc.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleViewNPC(npc)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={npc.portrait_url} alt={npc.name} />
                          <AvatarFallback>
                            {npc.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{npc.name}</h3>
                          {npc.role_title && (
                            <p className="text-sm text-muted-foreground">{npc.role_title}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {npc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
    </>
  );
};

export default EnhancedNPCDirectory;
