import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Users, Eye, EyeOff, ScrollText } from "lucide-react";

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
}

interface NPCDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npc: NPC;
  campaignId: string;
  isDM: boolean;
  onEdit: () => void;
}

const NPCDetailDrawer = ({ open, onOpenChange, npc, campaignId, isDM, onEdit }: NPCDetailDrawerProps) => {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [appearances, setAppearances] = useState<any[]>([]);
  const [faction, setFaction] = useState<any>(null);
  const [linkedNotes, setLinkedNotes] = useState<any[]>([]);

  useEffect(() => {
    if (open && npc) {
      loadRelationships();
      loadAppearances();
      loadLinkedNotes();
      if (npc.faction_id) loadFaction();
    }
  }, [open, npc]);

  const loadRelationships = async () => {
    const { data } = await supabase
      .from("npc_relationships")
      .select("*")
      .or(`source_id.eq.${npc.id},target_id.eq.${npc.id}`)
      .eq("campaign_id", campaignId);

    setRelationships(data || []);
  };

  const loadAppearances = async () => {
    const { data } = await supabase
      .from("npc_appearances")
      .select("*")
      .eq("npc_id", npc.id)
      .order("created_at", { ascending: false });

    setAppearances(data || []);
  };

  const loadFaction = async () => {
    if (!npc.faction_id) return;
    const { data } = await supabase
      .from("factions")
      .select("*")
      .eq("id", npc.faction_id)
      .single();

    setFaction(data);
  };

  const loadLinkedNotes = async () => {
    // Get notes that have this NPC linked
    const { data: links } = await supabase
      .from("note_links")
      .select("note_id")
      .eq("link_type", "npc")
      .eq("link_id", npc.id);

    if (!links || links.length === 0) {
      setLinkedNotes([]);
      return;
    }

    const noteIds = links.map(l => l.note_id);
    
    // Fetch the actual notes
    const { data: notes } = await supabase
      .from("session_notes")
      .select("id, title, content_markdown, visibility, is_pinned, created_at, updated_at")
      .in("id", noteIds)
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false });

    setLinkedNotes(notes || []);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={npc.portrait_url} alt={npc.name} />
                <AvatarFallback>
                  {npc.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle className="text-2xl">{npc.name}</DrawerTitle>
                {npc.pronouns && (
                  <p className="text-sm text-muted-foreground">({npc.pronouns})</p>
                )}
                {npc.role_title && (
                  <Badge variant="outline" className="mt-1">
                    {npc.role_title}
                  </Badge>
                )}
              </div>
            </div>
            {isDM && (
              <Button size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="appearances">Appearances</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Quick Facts */}
              <Card>
                <CardContent className="pt-6 space-y-2">
                  {faction && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Faction:</strong> {faction.name}
                      </span>
                    </div>
                  )}
                  {npc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {npc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Public Bio */}
              {npc.public_bio && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Public Information
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {npc.public_bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* GM-Only Sections */}
              {isDM && npc.gm_notes && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-amber-500" />
                      GM Notes
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {npc.gm_notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {isDM && npc.secrets && (
                <Card className="border-violet-500/20 bg-violet-500/5">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-violet-500" />
                      Secrets
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {npc.secrets}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="relationships" className="space-y-2">
              {relationships.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No relationships recorded
                </p>
              ) : (
                relationships.map((rel) => (
                  <Card key={rel.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline">{rel.relation}</Badge>
                          {rel.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{rel.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: rel.intensity }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="appearances" className="space-y-2">
              {appearances.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No appearances recorded
                </p>
              ) : (
                appearances.map((appearance) => (
                  <Card key={appearance.id}>
                    <CardContent className="pt-4">
                      <p className="text-sm">{appearance.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(appearance.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-2">
              {linkedNotes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No notes linked to this NPC yet. Use @{npc.name} in notes to link them automatically.
                </p>
              ) : (
                linkedNotes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold flex items-center gap-2">
                            {note.title}
                            {note.is_pinned && (
                              <Badge variant="secondary" className="text-xs">Pinned</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {note.content_markdown}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {note.visibility === "DM_ONLY" && "DM Only"}
                          {note.visibility === "SHARED" && "Shared"}
                          {note.visibility === "PRIVATE" && "Private"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NPCDetailDrawer;
