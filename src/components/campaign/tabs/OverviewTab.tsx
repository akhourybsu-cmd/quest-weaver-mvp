import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Scroll, Users, Plus, TrendingUp, MapPin, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OverviewTabProps {
  onQuickAdd: (type: string) => void;
}

export function OverviewTab({ onQuickAdd }: OverviewTabProps) {
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
            <div className="text-2xl font-cinzel font-bold">Tomorrow</div>
            <p className="text-sm text-muted-foreground">7:00 PM EST</p>
            <Button size="sm" className="mt-3 w-full" variant="outline">
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
            <div className="text-2xl font-cinzel font-bold">5</div>
            <p className="text-sm text-muted-foreground">3 main, 2 side</p>
            <Button size="sm" className="mt-3 w-full" variant="outline" onClick={() => onQuickAdd("quest")}>
              View All
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
            <div className="text-2xl font-cinzel font-bold">4/4</div>
            <p className="text-sm text-muted-foreground">All online</p>
            <Button size="sm" className="mt-3 w-full" variant="outline">
              View Party
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
            <div className="text-2xl font-cinzel font-bold">Act II</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">65% complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Story Arcs */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Story Arcs</CardTitle>
          <CardDescription>Track your campaign's narrative progression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Act I: The Awakening</span>
                  <Badge variant="outline" className="border-green-500/50 text-green-500">Complete</Badge>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Act II: Shadows Rising</span>
                  <Badge variant="outline" className="border-arcanePurple/50 text-arcanePurple">Active</Badge>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Act III: Final Reckoning</span>
                  <Badge variant="outline" className="border-brass/50 text-brass">Locked</Badge>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Recent Changes</CardTitle>
          <CardDescription>Latest updates to your campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-arcanePurple mt-1.5" />
              <div className="flex-1">
                <p><span className="font-medium">Quest updated:</span> "The Missing Tome"</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-brass mt-1.5" />
              <div className="flex-1">
                <p><span className="font-medium">NPC added:</span> "Elara the Sage"</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-dragonRed mt-1.5" />
              <div className="flex-1">
                <p><span className="font-medium">Session completed:</span> "Session 12"</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
