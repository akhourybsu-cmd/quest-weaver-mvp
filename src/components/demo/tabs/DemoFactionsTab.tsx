import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoFactions } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Target, Quote, TrendingUp, TrendingDown } from "lucide-react";
import { getReputationLabel, getReputationColor, getInfluenceLabel } from "@/lib/factionUtils";

interface DemoFactionsTabProps {
  campaign: DemoCampaign;
}

export function DemoFactionsTab({ campaign }: DemoFactionsTabProps) {
  const [selectedFaction, setSelectedFaction] = useState<ReturnType<typeof adaptDemoFactions>[0] | null>(null);
  const factions = adaptDemoFactions(campaign);

  // Use shared utilities from factionUtils

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-brass" />
        <h2 className="text-xl font-cinzel text-brass">Factions ({factions.length})</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {factions.map(faction => (
          <Card
            key={faction.id}
            className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer overflow-hidden"
            onClick={() => setSelectedFaction(faction)}
          >
            {faction.banner_url && (
              <div className="relative w-full h-24 overflow-hidden">
                <img
                  src={faction.banner_url}
                  alt={faction.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
            )}
            <CardHeader className={faction.banner_url ? "pt-2" : ""}>
              <CardTitle className="font-cinzel">{faction.name}</CardTitle>
              {faction.motto && (
                <p className="text-xs italic text-muted-foreground flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  "{faction.motto}"
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{faction.description}</p>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Reputation</span>
                  <span className={getReputationColor(faction.reputation)}>
                    {getReputationLabel(faction.reputation)}
                  </span>
                </div>
                <Progress 
                  value={(faction.reputation + 100) / 2} 
                  className="h-2"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Influence</span>
                  <span>{getInfluenceLabel(faction.influence_score)} ({faction.influence_score}%)</span>
                </div>
                <Progress value={faction.influence_score} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-1">
                {faction.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Faction Detail Dialog */}
      <Dialog open={!!selectedFaction} onOpenChange={() => setSelectedFaction(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFaction && (
            <>
              <DialogHeader>
                {selectedFaction.banner_url && (
                  <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
                    <img
                      src={selectedFaction.banner_url}
                      alt={selectedFaction.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <DialogTitle className="font-cinzel text-xl">{selectedFaction.name}</DialogTitle>
                {selectedFaction.motto && (
                  <p className="text-sm italic text-muted-foreground">"{selectedFaction.motto}"</p>
                )}
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedFaction.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-brass flex items-center gap-2">
                      {selectedFaction.reputation >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      Reputation
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={getReputationColor(selectedFaction.reputation)}>
                          {getReputationLabel(selectedFaction.reputation)}
                        </span>
                        <span className="text-muted-foreground">{selectedFaction.reputation}</span>
                      </div>
                      <Progress value={(selectedFaction.reputation + 100) / 2} className="h-3" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-brass">Influence</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{selectedFaction.influence_score}%</span>
                      </div>
                      <Progress value={selectedFaction.influence_score} className="h-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-brass mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Goals
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedFaction.goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedFaction.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
