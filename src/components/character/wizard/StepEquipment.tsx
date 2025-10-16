import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../CharacterWizard";

interface StepEquipmentProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepEquipment = ({ data, updateData }: StepEquipmentProps) => {
  // TODO: Implement equipment selection from class starting equipment
  // For now, just show a placeholder

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Equipment</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select your starting equipment based on your class choices, or roll for starting gold.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Equipment selection will be based on your class starting options. This step will be expanded with SRD equipment data.
          </p>
          <div className="mt-4">
            {data.equipment.length > 0 ? (
              <div className="space-y-2">
                {data.equipment.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge variant="outline">{item.item_ref}</Badge>
                    <span className="text-sm">×{item.qty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No equipment selected yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepEquipment;
