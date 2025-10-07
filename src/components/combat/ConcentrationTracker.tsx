import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Focus, X } from "lucide-react";

interface ConcentrationEffect {
  id: string;
  name: string;
  source: string;
  startRound: number;
}

interface ConcentrationTrackerProps {
  effect: ConcentrationEffect | null;
  onBreakConcentration: () => void;
}

const ConcentrationTracker = ({ effect, onBreakConcentration }: ConcentrationTrackerProps) => {
  if (!effect) return null;

  return (
    <Card className="border-secondary shadow-md">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="w-5 h-5 text-secondary" />
            <div>
              <div className="font-semibold">{effect.name}</div>
              <div className="text-xs text-muted-foreground">
                Concentrating • Round {effect.startRound}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBreakConcentration}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConcentrationTracker;
