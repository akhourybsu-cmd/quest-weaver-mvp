import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Swords, Play, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EncounterDialog } from "@/components/encounters/EncounterDialog";

interface EncountersTabProps {
  campaignId: string;
  liveSessionId?: string | null;
  onLaunchEncounter?: (encounterId: string) => void;
}

interface Encounter {
  id: string;
  name: string;
  description?: string | null;
  difficulty?: string | null;
  is_active: boolean;
  created_at: string;
  monster_count?: number;
  assigned_session?: string | null;
}

export function EncountersTab({ campaignId, liveSessionId, onLaunchEncounter }: EncountersTabProps) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "prepared" | "active" | "completed">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEncounters();

    const channel = supabase
      .channel("encounters-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "encounters",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          fetchEncounters(true); // silent refresh — no skeleton flash
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchEncounters = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Fetch encounters with monster counts and session assignments in parallel
      const [encounterResult, monsterCountsResult, sessionAssignmentsResult] = await Promise.all([
        supabase
          .from("encounters")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: false }),
        supabase
          .from("encounter_monsters")
          .select("encounter_id")
          .in("encounter_id", []), // placeholder, filled below
        supabase
          .from("session_encounters")
          .select("encounter_id, session_id"),
      ]);

      if (encounterResult.error) throw encounterResult.error;
      const encounterData = encounterResult.data || [];

      if (encounterData.length === 0) {
        setEncounters([]);
        return;
      }

      const encounterIds = encounterData.map(e => e.id);

      // Batch fetch monster counts and session assignments
      const [monsterRes, sessionRes] = await Promise.all([
        supabase
          .from("encounter_monsters")
          .select("encounter_id")
          .in("encounter_id", encounterIds),
        supabase
          .from("session_encounters")
          .select("encounter_id, session_id")
          .in("encounter_id", encounterIds),
      ]);

      // Aggregate monster counts
      const monsterCounts: Record<string, number> = {};
      (monsterRes.data || []).forEach((m: any) => {
        monsterCounts[m.encounter_id] = (monsterCounts[m.encounter_id] || 0) + 1;
      });

      // Build session assignment map
      const sessionMap: Record<string, string> = {};
      (sessionRes.data || []).forEach((s: any) => {
        sessionMap[s.encounter_id] = `Session ${s.session_id.substring(0, 8)}`;
      });

      const encountersWithCounts = encounterData.map(encounter => ({
        ...encounter,
        monster_count: monsterCounts[encounter.id] || 0,
        assigned_session: sessionMap[encounter.id] || null,
      }));

      setEncounters(encountersWithCounts);
    } catch (error: any) {
      console.error("Error fetching encounters:", error);
      toast.error("Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEncounter = () => {
    setSelectedEncounterId(null);
    setDialogOpen(true);
  };

  const handleEditEncounter = (encounterId: string) => {
    setSelectedEncounterId(encounterId);
    setDialogOpen(true);
  };

  const handleLaunchEncounter = async (encounterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Deactivate any other active encounters first
      await supabase
        .from("encounters")
        .update({ is_active: false, status: "ended" })
        .eq("campaign_id", campaignId)
        .eq("is_active", true);

      // Activate the selected encounter
      const { error } = await supabase
        .from("encounters")
        .update({ 
          is_active: true, 
          status: "preparing",
          current_round: 1
        })
        .eq("id", encounterId);

      if (error) throw error;

      toast.success("Encounter launched! Switching to battle view...");
      
      // Notify parent to switch to session tab
      if (onLaunchEncounter) {
        onLaunchEncounter(encounterId);
      }
    } catch (error: any) {
      console.error("Error launching encounter:", error);
      toast.error("Failed to launch encounter");
    }
  };

  const filteredEncounters = encounters.filter((enc) => {
    if (filter === "all") return true;
    if (filter === "active") return enc.is_active;
    if (filter === "prepared") return !enc.is_active;
    return false;
  });

  const getStatusBadge = (encounter: Encounter) => {
    if (encounter.is_active) {
      return <Badge className="bg-dragonRed/20 text-dragonRed border-dragonRed/30">Active</Badge>;
    }
    return <Badge variant="outline" className="border-brass/30 text-brass">Prepared</Badge>;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "text-buff-green";
      case "medium":
        return "text-warning-amber";
      case "hard":
        return "text-orange-500";
      case "deadly":
        return "text-dragonRed";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-cinzel font-bold">Encounters</h2>
          <p className="text-muted-foreground text-sm">Prepare and manage combat encounters</p>
        </div>
        <Button onClick={handleCreateEncounter}>
          <Plus className="w-4 h-4 mr-2" />
          Create Encounter
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({encounters.length})
        </Button>
        <Button
          variant={filter === "prepared" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("prepared")}
        >
          Prepared ({encounters.filter((e) => !e.is_active).length})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("active")}
        >
          Active ({encounters.filter((e) => e.is_active).length})
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredEncounters.length === 0 ? (
          <Card className="border-dashed border-2 border-brass/30 bg-card/30">
            <CardContent className="py-16 text-center">
              <div className="rounded-full bg-brass/10 p-4 mb-4 inline-block">
                <Swords className="w-10 h-10 text-brass/60" />
              </div>
              <h3 className="font-cinzel text-lg font-semibold mb-2">No encounters found</h3>
              <p className="text-sm text-muted-foreground">
                Create an encounter to prepare for combat
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEncounters.map((encounter) => (
            <Card 
              key={encounter.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 bg-card/50 border-brass/20"
              onClick={() => handleEditEncounter(encounter.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 font-cinzel">
                      <Swords className="w-4 h-4 text-brass shrink-0" />
                      {encounter.name}
                      {getStatusBadge(encounter)}
                      {encounter.assigned_session && (
                        <Badge variant="outline" className="gap-1 border-brass/30">
                          <Calendar className="w-3 h-3" />
                          {encounter.assigned_session}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {encounter.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {liveSessionId && !encounter.is_active && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={(e) => handleLaunchEncounter(encounter.id, e)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Launch
                      </Button>
                    )}
                    {encounter.is_active && (
                      <Badge variant="destructive" className="animate-pulse">
                        ⚔️ In Combat
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEncounter(encounter.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Swords className="w-4 h-4" />
                    <span>{encounter.monster_count || 0} monsters</span>
                  </div>
                  {encounter.difficulty && (
                    <div className={`font-medium ${getDifficultyColor(encounter.difficulty)}`}>
                      Difficulty: {encounter.difficulty}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EncounterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        encounterId={selectedEncounterId}
        onSuccess={fetchEncounters}
      />
    </div>
  );
}
