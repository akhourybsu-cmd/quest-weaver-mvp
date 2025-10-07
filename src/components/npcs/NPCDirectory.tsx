import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from "lucide-react";
import NPCDialog from "./NPCDialog";

interface NPC {
  id: string;
  name: string;
  role?: string;
  description?: string;
  location?: string;
  portraitUrl?: string;
}

interface NPCDirectoryProps {
  campaignId: string;
  isDM: boolean;
}

const NPCDirectory = ({ campaignId, isDM }: NPCDirectoryProps) => {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadNPCs = async () => {
      const { data } = await supabase
        .from("npcs")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("name");

      if (data) {
        setNpcs(
          data.map((n) => ({
            id: n.id,
            name: n.name,
            role: n.role,
            description: n.description,
            location: n.location,
            portraitUrl: n.portrait_url,
          }))
        );
      }
    };

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

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            NPCs
          </CardTitle>
          {isDM && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add NPC
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {npcs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No NPCs yet
          </div>
        ) : (
          <div className="grid gap-4">
            {npcs.map((npc) => (
              <div
                key={npc.id}
                className="flex items-start gap-4 p-3 border rounded-lg"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={npc.portraitUrl} alt={npc.name} />
                  <AvatarFallback>
                    {npc.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{npc.name}</div>
                  {npc.role && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {npc.role}
                    </Badge>
                  )}
                  {npc.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 {npc.location}
                    </div>
                  )}
                  {npc.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {npc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isDM && (
        <NPCDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
        />
      )}
    </Card>
  );
};

export default NPCDirectory;
