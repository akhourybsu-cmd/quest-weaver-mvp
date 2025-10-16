import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../CharacterWizard";

interface StepFeaturesProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepFeatures = ({ data, updateData }: StepFeaturesProps) => {
  // TODO: Load class features based on level and allow choices
  // For now, just show a placeholder

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Class Features</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Review your class features and make any required choices (e.g., Fighting Style, Metamagic).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Class features will be automatically granted based on your level. Features with choices will be presented here.
          </p>
          <div className="space-y-3">
            {data.features && data.features.length > 0 ? (
              data.features.map((feature, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{feature.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Lvl {feature.level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {feature.source}
                    </Badge>
                  </div>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Features will be added based on your class and level</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepFeatures;
