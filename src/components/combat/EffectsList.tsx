import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

interface Effect {
  id: string;
  name: string;
  description?: string;
  source?: string;
  ticksAt: "start" | "end" | "round";
  endRound?: number;
}

interface EffectsListProps {
  effects: Effect[];
  currentRound: number;
  onRemoveEffect: (id: string) => void;
}

const EffectsList = ({ effects, currentRound, onRemoveEffect }: EffectsListProps) => {
  if (effects.length === 0) return null;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Active Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {effects.map((effect) => (
          <div
            key={effect.id}
            className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-semibold">{effect.name}</div>
              {effect.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {effect.description}
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {effect.source && (
                  <Badge variant="outline" className="text-xs">
                    Source: {effect.source}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Ticks: {effect.ticksAt}
                </Badge>
                {effect.endRound && (
                  <Badge variant="outline" className="text-xs">
                    Ends: Round {effect.endRound}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveEffect(effect.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EffectsList;
