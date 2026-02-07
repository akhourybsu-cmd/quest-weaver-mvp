import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scroll, Users, MapPin, StickyNote, Swords, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityFeedProps {
  campaignId: string;
  demoMode?: boolean;
}

interface ActivityItem {
  id: string;
  type: "quest" | "npc" | "location" | "note" | "encounter" | "session";
  title: string;
  action: string;
  timestamp: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  quest: { icon: Scroll, color: "text-arcanePurple" },
  npc: { icon: Users, color: "text-teal-400" },
  location: { icon: MapPin, color: "text-emerald-400" },
  note: { icon: StickyNote, color: "text-amber-400" },
  encounter: { icon: Swords, color: "text-dragonRed" },
  session: { icon: Calendar, color: "text-blue-400" },
};

export function RecentActivityFeed({ campaignId, demoMode }: RecentActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoMode) {
      setActivities([]);
      setLoading(false);
      return;
    }
    fetchRecentActivity();
  }, [campaignId, demoMode]);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent items from multiple tables in parallel
      const [quests, npcs, locations, notes, encounters] = await Promise.all([
        supabase
          .from("quests")
          .select("id, title, updated_at")
          .eq("campaign_id", campaignId)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("characters")
          .select("id, name, updated_at")
          .eq("campaign_id", campaignId)
          .is("user_id", null) // NPCs only
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("locations")
          .select("id, name, updated_at")
          .eq("campaign_id", campaignId)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("session_notes")
          .select("id, title, updated_at")
          .eq("campaign_id", campaignId)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("encounters")
          .select("id, name, updated_at")
          .eq("campaign_id", campaignId)
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);

      const items: ActivityItem[] = [];

      quests.data?.forEach((q) =>
        items.push({ id: q.id, type: "quest", title: q.title, action: "Updated", timestamp: q.updated_at })
      );
      npcs.data?.forEach((n) =>
        items.push({ id: n.id, type: "npc", title: n.name, action: "Updated", timestamp: n.updated_at })
      );
      locations.data?.forEach((l) =>
        items.push({ id: l.id, type: "location", title: l.name, action: "Updated", timestamp: l.updated_at })
      );
      notes.data?.forEach((n) =>
        items.push({ id: n.id, type: "note", title: n.title, action: "Edited", timestamp: n.updated_at })
      );
      encounters.data?.forEach((e) =>
        items.push({ id: e.id, type: "encounter", title: e.name, action: "Updated", timestamp: e.updated_at })
      );

      // Sort by timestamp descending, take top 8
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 8));
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) return null;

  return (
    <Card className="bg-card/50 border-brass/20">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors"
              >
                <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.title}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
