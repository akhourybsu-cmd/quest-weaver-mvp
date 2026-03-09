import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoParty } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Shield, Heart, Swords, User } from "lucide-react";

interface DemoPartyTabProps {
  campaign: DemoCampaign;
}

export function DemoPartyTab({ campaign }: DemoPartyTabProps) {
  const party = adaptDemoParty(campaign);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold">Party Roster</h2>
        <Badge variant="outline" className="border-brass/30 text-brass">
          {party.length} Members
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {party.map((pc) => {
          const hpPercent = Math.round((pc.hp / pc.maxHp) * 100);
          return (
            <Card key={pc.id} className="bg-card/50 border-brass/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 border-2 border-arcanePurple/30">
                    <AvatarFallback className="bg-arcanePurple/20 text-ink font-cinzel text-lg">
                      {pc.portraitInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cinzel font-semibold truncate">{pc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pc.race} {pc.class} · Level {pc.level}
                    </p>
                    <p className="text-xs text-brass mt-0.5">
                      <User className="w-3 h-3 inline mr-1" />
                      {pc.playerName}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-brass" />
                        <span className="text-sm font-medium">{pc.ac}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Heart className="w-4 h-4 text-dragonRed" />
                          <span className="text-sm font-medium">{pc.hp}/{pc.maxHp}</span>
                        </div>
                        <Progress value={hpPercent} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
