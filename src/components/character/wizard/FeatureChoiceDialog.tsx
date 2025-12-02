import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeatureChoice {
  key: string;
  options: string[];
  description?: string;
}

interface FeatureChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  choices: FeatureChoice[];
  currentSelections: Record<string, string>;
  onConfirm: (selections: Record<string, string>) => void;
}

const FeatureChoiceDialog = ({
  open,
  onOpenChange,
  featureName,
  choices,
  currentSelections,
  onConfirm,
}: FeatureChoiceDialogProps) => {
  const [selections, setSelections] = useState<Record<string, string>>(currentSelections);

  const handleSelect = (choiceKey: string, value: string) => {
    setSelections((prev) => ({ ...prev, [choiceKey]: value }));
  };

  const handleConfirm = () => {
    onConfirm(selections);
    onOpenChange(false);
  };

  const allSelected = choices.every((choice) => selections[choice.key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{featureName}</DialogTitle>
          <DialogDescription>
            Make your selection(s) for this feature.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-6 py-4">
            {choices.map((choice) => (
              <div key={choice.key} className="space-y-3">
                {choice.description && (
                  <p className="text-sm text-muted-foreground">{choice.description}</p>
                )}
                <RadioGroup
                  value={selections[choice.key] || ""}
                  onValueChange={(value) => handleSelect(choice.key, value)}
                >
                  {choice.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${choice.key}-${option}`} />
                      <Label htmlFor={`${choice.key}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allSelected}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureChoiceDialog;
