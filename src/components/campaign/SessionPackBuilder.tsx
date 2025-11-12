import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { toast } from "sonner";

interface SessionPackBuilderProps {
  campaignId: string;
  sessionId: string;
  sessionName: string;
}

interface Quest {
  id: string;
  title: string;
  status: string;
  quest_type: string;
  assigned?: boolean;
  carry_over_from?: string;
}

interface Encounter {
  id: string;
  name: string;
  difficulty?: string | null;
  monster_count: number;
  assigned?: boolean;
  display_order?: number;
}

interface NPC {
  id: string;
  name: string;
  role: string | null;
  assigned?: boolean;
}

interface Handout {
  id: string;
  title: string;
  content_type: string;
  assigned?: boolean;
}

interface Location {
  id: string;
  name: string;
  location_type: string | null;
  assigned?: boolean;
}

export function SessionPackBuilder({ campaignId, sessionId, sessionName }: SessionPackBuilderProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllContent();
  }, [campaignId, sessionId]);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchQuests(),
        fetchEncounters(),
        fetchNPCs(),
        fetchHandouts(),
        fetchLocations(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuests = async () => {
    const { data: questData } = await supabase
      .from("quests")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    const { data: assigned } = await supabase
      .from("session_quests")
      .select("quest_id, carry_over_from_session_id")
      .eq("session_id", sessionId);

    const assignedIds = new Set(assigned?.map((a) => a.quest_id) || []);

    setQuests(
      (questData || []).map((q) => ({
        ...q,
        assigned: assignedIds.has(q.id),
        carry_over_from: assigned?.find((a) => a.quest_id === q.id)?.carry_over_from_session_id,
      }))
    );
  };

  const fetchEncounters = async () => {
    const { data: encounterData } = await supabase
      .from("encounters")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    const { data: assigned } = await supabase
      .from("session_encounters")
      .select("encounter_id, display_order")
      .eq("session_id", sessionId);

    const assignedMap = new Map(assigned?.map((a) => [a.encounter_id, a.display_order]) || []);

    const encountersWithCounts = await Promise.all(
      (encounterData || []).map(async (enc) => {
        const { count } = await supabase
          .from("encounter_monsters")
          .select("*", { count: "exact", head: true })
          .eq("encounter_id", enc.id);

        return {
          ...enc,
          monster_count: count || 0,
          assigned: assignedMap.has(enc.id),
          display_order: assignedMap.get(enc.id) || 0,
        };
      })
    );

    setEncounters(encountersWithCounts);
  };

  const fetchNPCs = async () => {
    const { data: npcData } = await supabase
      .from("npcs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true });

    const { data: assigned } = await supabase
      .from("session_npcs")
      .select("npc_id")
      .eq("session_id", sessionId);

    const assignedIds = new Set(assigned?.map((a) => a.npc_id) || []);

    setNpcs((npcData || []).map((n) => ({ ...n, assigned: assignedIds.has(n.id) })));
  };

  const fetchHandouts = async () => {
    const { data: handoutData } = await supabase
      .from("handouts")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    const { data: assigned } = await supabase
      .from("session_handouts")
      .select("handout_id")
      .eq("session_id", sessionId);

    const assignedIds = new Set(assigned?.map((a) => a.handout_id) || []);

    setHandouts((handoutData || []).map((h) => ({ ...h, assigned: assignedIds.has(h.id) })));
  };

  const fetchLocations = async () => {
    const { data: locationData } = await supabase
      .from("locations")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true });

    const { data: assigned } = await supabase
      .from("session_locations")
      .select("location_id")
      .eq("session_id", sessionId);

    const assignedIds = new Set(assigned?.map((a) => a.location_id) || []);

    setLocations((locationData || []).map((l) => ({ ...l, assigned: assignedIds.has(l.id) })));
  };

  const toggleQuestAssignment = async (questId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await supabase.from("session_quests").delete().eq("session_id", sessionId).eq("quest_id", questId);
        toast.success("Quest removed from session");
      } else {
        await supabase.from("session_quests").insert({ session_id: sessionId, quest_id: questId });
        toast.success("Quest added to session");
      }
      fetchQuests();
    } catch (error: any) {
      toast.error("Failed to update quest assignment");
    }
  };

  const toggleEncounterAssignment = async (encounterId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await supabase.from("session_encounters").delete().eq("session_id", sessionId).eq("encounter_id", encounterId);
        toast.success("Encounter removed from session");
      } else {
        const maxOrder = Math.max(...encounters.filter((e) => e.assigned).map((e) => e.display_order || 0), 0);
        await supabase.from("session_encounters").insert({
          session_id: sessionId,
          encounter_id: encounterId,
          display_order: maxOrder + 1,
        });
        toast.success("Encounter added to session");
      }
      fetchEncounters();
    } catch (error: any) {
      toast.error("Failed to update encounter assignment");
    }
  };

  const toggleNPCAssignment = async (npcId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await supabase.from("session_npcs").delete().eq("session_id", sessionId).eq("npc_id", npcId);
        toast.success("NPC removed from session");
      } else {
        await supabase.from("session_npcs").insert({ session_id: sessionId, npc_id: npcId });
        toast.success("NPC added to session");
      }
      fetchNPCs();
    } catch (error: any) {
      toast.error("Failed to update NPC assignment");
    }
  };

  const toggleHandoutAssignment = async (handoutId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await supabase.from("session_handouts").delete().eq("session_id", sessionId).eq("handout_id", handoutId);
        toast.success("Handout removed from session");
      } else {
        await supabase.from("session_handouts").insert({ session_id: sessionId, handout_id: handoutId });
        toast.success("Handout added to session");
      }
      fetchHandouts();
    } catch (error: any) {
      toast.error("Failed to update handout assignment");
    }
  };

  const toggleLocationAssignment = async (locationId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await supabase.from("session_locations").delete().eq("session_id", sessionId).eq("location_id", locationId);
        toast.success("Location removed from session");
      } else {
        await supabase.from("session_locations").insert({ session_id: sessionId, location_id: locationId });
        toast.success("Location added to session");
      }
      fetchLocations();
    } catch (error: any) {
      toast.error("Failed to update location assignment");
    }
  };

  const assignedQuests = quests.filter((q) => q.assigned);
  const assignedEncounters = encounters.filter((e) => e.assigned).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const assignedNPCs = npcs.filter((n) => n.assigned);
  const assignedHandouts = handouts.filter((h) => h.assigned);
  const assignedLocations = locations.filter((l) => l.assigned);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Building Pack for: {sessionName}</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Quests ({assignedQuests.length})</h4>
                  {assignedQuests.map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{quest.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{quest.status}</Badge>
                          {quest.carry_over_from && (
                            <Badge variant="secondary" className="text-xs">Auto-carried</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleQuestAssignment(quest.id, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Encounters ({assignedEncounters.length})</h4>
                  {assignedEncounters.map((enc) => (
                    <div key={enc.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{enc.name}</div>
                        <div className="text-sm text-muted-foreground">{enc.monster_count} monsters</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleEncounterAssignment(enc.id, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">NPCs ({assignedNPCs.length})</h4>
                  {assignedNPCs.map((npc) => (
                    <div key={npc.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-sm text-muted-foreground">{npc.role || "No role"}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleNPCAssignment(npc.id, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Handouts ({assignedHandouts.length})</h4>
                  {assignedHandouts.map((handout) => (
                    <div key={handout.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{handout.title}</div>
                        <div className="text-sm text-muted-foreground">{handout.content_type}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleHandoutAssignment(handout.id, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Locations ({assignedLocations.length})</h4>
                  {assignedLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.location_type || "No type"}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLocationAssignment(location.id, true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quests">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="quests">Quests</TabsTrigger>
                <TabsTrigger value="encounters">Encounters</TabsTrigger>
                <TabsTrigger value="npcs">NPCs</TabsTrigger>
                <TabsTrigger value="handouts">Handouts</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>

              <TabsContent value="quests">
                <ScrollArea className="h-[520px]">
                  {quests.filter((q) => !q.assigned).map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{quest.title}</div>
                        <Badge variant="outline" className="text-xs mt-1">{quest.status}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleQuestAssignment(quest.id, false)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="encounters">
                <ScrollArea className="h-[520px]">
                  {encounters.filter((e) => !e.assigned).map((enc) => (
                    <div key={enc.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{enc.name}</div>
                        <div className="text-sm text-muted-foreground">{enc.monster_count} monsters</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEncounterAssignment(enc.id, false)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="npcs">
                <ScrollArea className="h-[520px]">
                  {npcs.filter((n) => !n.assigned).map((npc) => (
                    <div key={npc.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-sm text-muted-foreground">{npc.role || "No role"}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleNPCAssignment(npc.id, false)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="handouts">
                <ScrollArea className="h-[520px]">
                  {handouts.filter((h) => !h.assigned).map((handout) => (
                    <div key={handout.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{handout.title}</div>
                        <div className="text-sm text-muted-foreground">{handout.content_type}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleHandoutAssignment(handout.id, false)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="locations">
                <ScrollArea className="h-[520px]">
                  {locations.filter((l) => !l.assigned).map((location) => (
                    <div key={location.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.location_type || "No type"}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleLocationAssignment(location.id, false)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
