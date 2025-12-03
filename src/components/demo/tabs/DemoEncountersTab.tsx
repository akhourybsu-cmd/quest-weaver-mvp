import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoEncounters, adaptDemoLocations } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Swords, MapPin, Skull, Play, CheckCircle } from "lucide-react";

interface DemoEncountersTabProps {
  campaign: DemoCampaign;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  trivial: { label: "Trivial", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
  easy: { label: "Easy", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  hard: { label: "Hard", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  deadly: { label: "Deadly", color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: "Planned", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground border-muted" },
};

export function DemoEncountersTab({ campaign }: DemoEncountersTabProps) {
  const encounters = adaptDemoEncounters(campaign);
  const locations = adaptDemoLocations(campaign);

  const plannedEncounters = encounters.filter(e => e.status === "planned");
  const completedEncounters = encounters.filter(e => e.status === "completed");

  const getLocation = (locationId?: string) => locationId ? locations.find(l => l.id === locationId) : null;

  return (
    <div className="space-y-8">
      {/* Planned Encounters */}
      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5" />
          Planned Encounters
        </h2>
        {plannedEncounters.length === 0 ? (
          <Card className="border-brass/20">
            <CardContent className="py-8 text-center text-muted-foreground">
              No planned encounters
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plannedEncounters.map(encounter => {
              const location = getLocation(encounter.location_id);
              const difficulty = difficultyConfig[encounter.difficulty] || difficultyConfig.medium;
              
              return (
                <Card key={encounter.id} className="border-brass/20 hover:border-brass/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-cinzel">{encounter.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={difficulty.color}>
                          {difficulty.label}
                        </Badge>
                        <Badge variant="outline" className={statusConfig.planned.color}>
                          Planned
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{encounter.description}</p>
                    
                    {location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{location.name}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Skull className="w-4 h-4" />
                        Monsters
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {encounter.monsters.map((monster, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {monster.count}x {monster.name} (CR {monster.cr})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-2" disabled>
                      <Play className="w-4 h-4 mr-2" />
                      Launch Encounter (Demo)
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Encounters */}
      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Completed Encounters
        </h2>
        {completedEncounters.length === 0 ? (
          <Card className="border-brass/20">
            <CardContent className="py-8 text-center text-muted-foreground">
              No completed encounters
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedEncounters.map(encounter => {
              const location = getLocation(encounter.location_id);
              const difficulty = difficultyConfig[encounter.difficulty] || difficultyConfig.medium;
              
              return (
                <Card key={encounter.id} className="border-brass/20">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-cinzel font-semibold">{encounter.name}</h3>
                        <p className="text-sm text-muted-foreground">{encounter.description}</p>
                        {location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{location.name}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {encounter.monsters.map((monster, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {monster.count}x {monster.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={difficulty.color}>
                          {difficulty.label}
                        </Badge>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
