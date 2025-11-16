import { DemoCampaign } from "@/data/demoSeeds";
import { getDemoCampaignStats } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Scroll, Users, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DemoOverviewTabProps {
  campaign: DemoCampaign;
}

export function DemoOverviewTab({ campaign }: DemoOverviewTabProps) {
  const stats = getDemoCampaignStats(campaign);

  return (
    <div className="space-y-6">
      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-arcanePurple" />
              Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-cinzel font-bold">{campaign.name}</div>
            <p className="text-sm text-muted-foreground">Demo Campaign</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scroll className="w-4 h-4 text-arcanePurple" />
              Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-cinzel font-bold">{stats.activeQuests}</div>
            <p className="text-sm text-muted-foreground">
              {stats.completedQuests} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-arcanePurple" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-cinzel font-bold">{campaign.locations.length}</div>
            <p className="text-sm text-muted-foreground">Discovered</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-arcanePurple" />
              NPCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-cinzel font-bold">{campaign.npcs.length}</div>
            <p className="text-sm text-muted-foreground">Met</p>
          </CardContent>
        </Card>
      </div>

      {/* Story Progress */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Main Storyline</span>
              <Badge variant="outline" className="border-arcanePurple/50 text-arcanePurple">
                In Progress
              </Badge>
            </div>
            <Progress value={60} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeQuests} active quests, {stats.completedQuests} completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="w-full">
              Add Quest
            </Button>
            <Button variant="outline" className="w-full">
              Add NPC
            </Button>
            <Button variant="outline" className="w-full">
              Add Location
            </Button>
            <Button variant="outline" className="w-full">
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
