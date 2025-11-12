import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Scroll, Users, Plus, TrendingUp, MapPin, Package, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface OverviewTabProps {
  onQuickAdd: (type: string) => void;
}

export function OverviewTab({ onQuickAdd }: OverviewTabProps) {
  const { campaignId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeQuests: 0,
    partyMembers: 0,
    nextSession: null as string | null,
    completedQuests: 0,
  });

  useEffect(() => {
    if (!campaignId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Count active quests
        const { count: activeQuestsCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .in('status', ['hook', 'active']);

        // Count completed quests
        const { count: completedQuestsCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'complete');

        // Count party members
        const { count: partyCount } = await supabase
          .from('characters')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .not('user_id', 'is', null);

        // Get next session
        const { data: nextSession } = await supabase
          .from('campaign_sessions')
          .select('started_at')
          .eq('campaign_id', campaignId)
          .eq('status', 'live')
          .order('started_at', { ascending: true })
          .limit(1)
          .single();

        setStats({
          activeQuests: activeQuestsCount || 0,
          completedQuests: completedQuestsCount || 0,
          partyMembers: partyCount || 0,
          nextSession: nextSession?.started_at || null,
        });
      } catch (error) {
        console.error('Failed to fetch campaign stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-arcanePurple" />
      </div>
    );
  }

  const totalQuests = stats.activeQuests + stats.completedQuests;
  const progress = totalQuests > 0 ? (stats.completedQuests / totalQuests) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-arcanePurple" />
              Next Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextSession ? (
              <>
                <div className="text-2xl font-cinzel font-bold">
                  {new Date(stats.nextSession).toLocaleDateString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(stats.nextSession).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="text-lg text-muted-foreground">No session scheduled</div>
            )}
            <Button size="sm" className="mt-3 w-full" variant="outline" disabled={!stats.nextSession}>
              Review Session Pack
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scroll className="w-4 h-4 text-arcanePurple" />
              Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activeQuests > 0 ? (
              <>
                <div className="text-2xl font-cinzel font-bold">{stats.activeQuests}</div>
                <p className="text-sm text-muted-foreground">{stats.completedQuests} completed</p>
              </>
            ) : (
              <div className="text-lg text-muted-foreground">No active quests</div>
            )}
            <Button size="sm" className="mt-3 w-full" variant="outline" onClick={() => onQuickAdd("quest")}>
              {stats.activeQuests > 0 ? 'View All' : 'Create Quest'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-arcanePurple" />
              Party Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.partyMembers > 0 ? (
              <>
                <div className="text-2xl font-cinzel font-bold">{stats.partyMembers}</div>
                <p className="text-sm text-muted-foreground">Party members</p>
              </>
            ) : (
              <div className="text-lg text-muted-foreground">No party members</div>
            )}
            <Button size="sm" className="mt-3 w-full" variant="outline">
              Invite Players
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-arcanePurple" />
              Campaign Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-cinzel font-bold">{Math.round(progress)}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedQuests} of {totalQuests} quests complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {totalQuests === 0 && stats.partyMembers === 0 && (
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scroll className="w-16 h-16 text-brass/50 mb-4" />
            <h3 className="text-xl font-cinzel font-bold mb-2">Your Campaign Awaits</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start by creating quests, inviting players, or adding NPCs to bring your world to life.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => onQuickAdd("quest")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Quest
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Invite Players
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Quick Add</CardTitle>
          <CardDescription>Create new campaign content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => onQuickAdd("quest")} className="h-auto py-4 flex-col">
              <Scroll className="w-6 h-6 mb-2 text-arcanePurple" />
              <span>Quest</span>
            </Button>
            <Button variant="outline" onClick={() => onQuickAdd("npc")} className="h-auto py-4 flex-col">
              <Users className="w-6 h-6 mb-2 text-arcanePurple" />
              <span>NPC</span>
            </Button>
            <Button variant="outline" onClick={() => onQuickAdd("location")} className="h-auto py-4 flex-col">
              <MapPin className="w-6 h-6 mb-2 text-arcanePurple" />
              <span>Location</span>
            </Button>
            <Button variant="outline" onClick={() => onQuickAdd("item")} className="h-auto py-4 flex-col">
              <Package className="w-6 h-6 mb-2 text-arcanePurple" />
              <span>Item</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
