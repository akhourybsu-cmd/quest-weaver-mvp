import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";

export interface QuestStep {
  id?: string;
  description: string;
  objectiveType: string;
  progressMax: number;
}

const OBJECTIVE_TYPE_COLORS: Record<string, string> = {
  combat: "border-l-dragon-red bg-dragon-red/5",
  exploration: "border-l-buff-green bg-buff-green/5",
  fetch: "border-l-brass bg-brass/5",
  escort: "border-l-primary bg-primary/5",
  puzzle: "border-l-arcane-purple bg-arcane-purple/5",
  social: "border-l-blue-400 bg-blue-400/5",
  other: "border-l-muted-foreground bg-muted/30",
};

const OBJECTIVE_TYPE_LABELS: Record<string, string> = {
  combat: "Combat",
  exploration: "Exploration",
  fetch: "Fetch",
  escort: "Escort",
  puzzle: "Puzzle",
  social: "Social",
  other: "Objective",
};

interface QuestDialogObjectivesProps {
  steps: QuestStep[];
  onStepsChange: (steps: QuestStep[]) => void;
}

export function QuestDialogObjectives({ steps, onStepsChange }: QuestDialogObjectivesProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleAddStep = () => {
    onStepsChange([...steps, { description: "", objectiveType: "other", progressMax: 1 }]);
  };

  const handleRemoveStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
    if (expandedStep === index) setExpandedStep(null);
  };

  const handleStepChange = (index: number, field: keyof QuestStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onStepsChange(newSteps);
  };

  const toggleExpanded = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-cinzel text-foreground/80">Quest Objectives</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStep}
          className="border-brass/30 hover:bg-brass/10"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Step
        </Button>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const typeColor = OBJECTIVE_TYPE_COLORS[step.objectiveType] || OBJECTIVE_TYPE_COLORS.other;
          const isExpanded = expandedStep === index;

          return (
            <div
              key={index}
              className={`border rounded-lg border-l-4 ${typeColor} transition-colors`}
            >
              <div className="p-3 space-y-2">
                {/* Step number + description (always visible) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground shrink-0 w-5 text-center">
                    {index + 1}
                  </span>
                  <Input
                    value={step.description}
                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                    placeholder={`e.g., Investigate the old tower...`}
                    className="flex-1 h-8 text-sm border-brass/20"
                  />
                  <Badge variant="outline" className="text-[10px] shrink-0 border-brass/30 px-1.5">
                    {OBJECTIVE_TYPE_LABELS[step.objectiveType] || "Objective"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleExpanded(index)}
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Expanded: Type + Progress Goal */}
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-2 pl-7">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select
                        value={step.objectiveType}
                        onValueChange={(val) => handleStepChange(index, 'objectiveType', val)}
                      >
                        <SelectTrigger className="h-8 text-xs border-brass/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exploration">Exploration</SelectItem>
                          <SelectItem value="combat">Combat</SelectItem>
                          <SelectItem value="fetch">Fetch</SelectItem>
                          <SelectItem value="escort">Escort</SelectItem>
                          <SelectItem value="puzzle">Puzzle</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Progress Goal</Label>
                      <Input
                        type="number"
                        min="1"
                        value={step.progressMax}
                        onChange={(e) => handleStepChange(index, 'progressMax', parseInt(e.target.value) || 1)}
                        className="h-8 text-xs border-brass/20"
                        placeholder="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-brass/20 rounded-lg">
          No objectives yet. Add steps to track quest progress.
        </div>
      )}
    </div>
  );
}
