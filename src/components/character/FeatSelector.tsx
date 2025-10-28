import { useState, useEffect } from "react";
import { FeatsSRD, type SrdFeat } from "@/lib/srd/feats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

interface FeatSelectorProps {
  level: number;
  abilityScores: Record<string, number>;
  currentFeats: string[];
  onSelectFeat: (featId: string) => void;
  selectedFeatId?: string;
}

export const FeatSelector = ({ 
  level, 
  abilityScores, 
  currentFeats, 
  onSelectFeat,
  selectedFeatId 
}: FeatSelectorProps) => {
  const [feats, setFeats] = useState<SrdFeat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeats();
  }, [level, currentFeats]);

  const loadFeats = async () => {
    try {
      const eligibleFeats = await FeatsSRD.getEligibleFeats(level, abilityScores, currentFeats);
      setFeats(eligibleFeats);
    } catch (error) {
      console.error("Error loading feats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading feats...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Select a Feat</h3>
      </div>
      
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {feats.map((feat) => (
            <Card 
              key={feat.id}
              className={`cursor-pointer transition-all ${
                selectedFeatId === feat.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectFeat(feat.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{feat.name}</CardTitle>
                  {selectedFeatId === feat.id && (
                    <Badge>Selected</Badge>
                  )}
                </div>
                {feat.prerequisites && Object.keys(feat.prerequisites).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {feat.prerequisites.min_level && (
                      <Badge variant="outline" className="text-xs">
                        Level {feat.prerequisites.min_level}+
                      </Badge>
                    )}
                    {feat.prerequisites.min_ability_scores && 
                      Object.entries(feat.prerequisites.min_ability_scores).map(([ability, score]) => (
                        <Badge key={ability} variant="outline" className="text-xs">
                          {ability.toUpperCase()} {String(score)}+
                        </Badge>
                      ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{feat.description}</p>
                
                {feat.ability_increases && Array.isArray(feat.ability_increases) && feat.ability_increases.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Ability Score Increases:</p>
                    <div className="flex flex-wrap gap-1">
                      {feat.ability_increases.map((inc: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          +{inc.increase} {String(inc.ability).toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {feat.grants?.features && Array.isArray(feat.grants.features) && feat.grants.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Features:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {feat.grants.features.map((feature: any, idx: number) => (
                        <li key={idx}>• {feature.name || String(feature)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
