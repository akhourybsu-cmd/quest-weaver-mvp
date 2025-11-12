import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Swords, Play, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface EncountersTabProps {
  campaignId: string;
  liveSessionId?: string | null;
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

export function EncountersTab({ campaignId, liveSessionId }: EncountersTabProps) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "prepared" | "active" | "completed">("all");
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
          fetchEncounters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      
      // Fetch encounters with monster count
      const { data: encounterData, error: encounterError } = await supabase
        .from("encounters")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (encounterError) throw encounterError;

      // Fetch monster counts for each encounter
      const encountersWithCounts = await Promise.all(
        (encounterData || []).map(async (encounter) => {
          const { count } = await supabase
            .from("encounter_monsters")
            .select("*", { count: "exact", head: true })
            .eq("encounter_id", encounter.id);

          // Check if assigned to any session
          const { data: sessionData } = await supabase
            .from("session_encounters")
            .select("session_id")
            .eq("encounter_id", encounter.id)
            .maybeSingle();

          return {
            ...encounter,
            monster_count: count || 0,
            assigned_session: sessionData ? `Session ${sessionData.session_id.substring(0, 8)}` : null,
          };
        })
      );

      setEncounters(encountersWithCounts);
    } catch (error: any) {
      console.error("Error fetching encounters:", error);
      toast.error("Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEncounter = async () => {
    try {
      const { data: newEncounter, error } = await supabase
        .from("encounters")
        .insert({
          campaign_id: campaignId,
          name: "New Encounter",
          description: "",
          difficulty: "medium",
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Encounter created");
      fetchEncounters();
    } catch (error: any) {
      console.error("Error creating encounter:", error);
      toast.error("Failed to create encounter");
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
      return <Badge variant="destructive">Active</Badge>;
    }
    return <Badge variant="secondary">Prepared</Badge>;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-orange-600";
      case "deadly":
        return "text-red-600";
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
          <h2 className="text-2xl font-bold">Encounters</h2>
          <p className="text-muted-foreground">Prepare and manage combat encounters</p>
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
          <Card>
            <CardContent className="py-8 text-center">
              <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No encounters found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create an encounter to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEncounters.map((encounter) => (
            <Card key={encounter.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {encounter.name}
                      {getStatusBadge(encounter)}
                      {encounter.assigned_session && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="w-3 h-3" />
                          {encounter.assigned_session}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {encounter.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {liveSessionId && !encounter.is_active && (
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Launch
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/session-dm?campaign=${campaignId}`)}
                    >
                      Edit
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
    </div>
  );
}
