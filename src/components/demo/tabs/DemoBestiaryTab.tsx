import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoMonsters } from "@/lib/demoAdapters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Heart, Shield } from "lucide-react";

interface DemoBestiaryTabProps {
  campaign: DemoCampaign;
}

export function DemoBestiaryTab({ campaign }: DemoBestiaryTabProps) {
  const monsters = adaptDemoMonsters(campaign);

  const getCRColor = (cr: string) => {
    const crNum = parseFloat(cr);
    if (crNum >= 10) return "border-dragonRed/50 text-dragonRed";
    if (crNum >= 5) return "border-orange-500/50 text-orange-500";
    return "border-green-500/50 text-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Bestiary</h2>
          <p className="text-muted-foreground">Creatures encountered in your campaign</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {monsters.map((monster) => (
          <Card key={monster.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    <Flame className="w-5 h-5 text-arcanePurple" />
                    {monster.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {monster.type} • {monster.size}
                  </CardDescription>
                </div>
                {monster.cr && (
                  <Badge variant="outline" className={getCRColor(monster.cr.toString())}>
                    CR {monster.cr}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-dragonRed" />
                  <span>{monster.hp_avg || "?"} HP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brass" />
                  <span>AC {monster.ac || "?"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
