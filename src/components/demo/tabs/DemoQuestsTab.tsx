import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoQuests } from "@/lib/demoAdapters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scroll, MapPin, Users, Eye, EyeOff } from "lucide-react";

interface DemoQuestsTabProps {
  campaign: DemoCampaign;
}

export function DemoQuestsTab({ campaign }: DemoQuestsTabProps) {
  const quests = adaptDemoQuests(campaign);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-arcanePurple/50 text-arcanePurple";
      case "completed":
        return "border-green-500/50 text-green-500";
      case "failed":
        return "border-dragonRed/50 text-dragonRed";
      default:
        return "border-brass/50 text-brass";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Quests</h2>
          <p className="text-muted-foreground">Track your party's adventures</p>
        </div>
      </div>

      <div className="grid gap-4">
        {quests.map((quest) => (
          <Card key={quest.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-arcanePurple" />
                    {quest.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{quest.description}</CardDescription>
                </div>
                <Badge variant="outline" className={getStatusColor(quest.status)}>
                  {quest.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              {quest.steps && quest.steps.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {quest.steps.filter((o: any) => o.completed).length} / {quest.steps.length}
                    </span>
                  </div>
                  <Progress 
                    value={(quest.steps.filter((o: any) => o.completed).length / quest.steps.length) * 100} 
                    className="h-2" 
                  />
                </div>
              )}

              {/* Related Entities */}
              <div className="flex flex-wrap gap-4 text-sm">
                {quest.npc && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brass" />
                    <span className="text-muted-foreground">{quest.npc.name}</span>
                  </div>
                )}
                {quest.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brass" />
                    <span className="text-muted-foreground">{quest.location.name}</span>
                  </div>
                )}
              </div>

              {/* Steps */}
              {quest.steps && quest.steps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Steps:</p>
                  <ul className="space-y-1">
                    {quest.steps.map((step: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className={step.completed ? "line-through text-muted-foreground" : ""}>
                          • {step.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
