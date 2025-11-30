import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search } from "lucide-react";
import NPCDetailDrawer from "@/components/npcs/NPCDetailDrawer";

interface NPC {
  id: string;
  name: string;
  pronouns?: string;
  role_title?: string;
  public_bio?: string;
  portrait_url?: string;
  tags: string[];
  status: string;
  alignment?: string;
}

interface PlayerNPCDirectoryProps {
  campaignId: string;
}

export function PlayerNPCDirectory({ campaignId }: PlayerNPCDirectoryProps) {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadNPCs();

    const channel = supabase
      .channel(`player-npcs:${campaignId}`)
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
      .select("id, name, pronouns, role_title, public_bio, portrait_url, tags, status, alignment")
      .eq("campaign_id", campaignId)
      .eq("player_visible", true)
      .order("name");

    if (!error && data) {
      setNpcs(data as NPC[]);
    }
  };

  const filteredNPCs = npcs.filter((npc) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      npc.name.toLowerCase().includes(search) ||
      npc.role_title?.toLowerCase().includes(search) ||
      npc.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });

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

  return (
    <>
      <NPCDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        npc={selectedNPC}
        isDM={false}
        campaignId={campaignId}
        onEdit={() => {}}
      />

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 font-cinzel">
              <Users className="w-5 h-5" />
              Known NPCs
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search NPCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredNPCs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No NPCs to display</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredNPCs.map((npc) => (
                  <Card
                    key={npc.id}
                    className="cursor-pointer hover:shadow-md hover:border-brand-brass/70 transition-all border-2 border-border/50"
                    onClick={() => handleViewNPC(npc)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(npc.status)}`}
                      />

                      <Avatar className="w-12 h-12 shrink-0 border-2 border-brand-brass/70">
                        <AvatarImage src={npc.portrait_url} alt={npc.name} />
                        <AvatarFallback className="bg-muted">
                          {npc.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-cinzel font-semibold truncate">{npc.name}</h3>
                        {npc.role_title && (
                          <p className="text-sm text-muted-foreground truncate">{npc.role_title}</p>
                        )}
                        {npc.pronouns && (
                          <p className="text-xs text-muted-foreground">{npc.pronouns}</p>
                        )}
                      </div>

                      {npc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {npc.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {npc.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{npc.tags.length - 2}
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