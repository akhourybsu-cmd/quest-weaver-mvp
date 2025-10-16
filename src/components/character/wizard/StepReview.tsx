import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import type { WizardData } from "../CharacterWizard";

interface StepReviewProps {
  data: WizardData;
  onFinalize: () => void;
  loading: boolean;
}

const StepReview = ({ data, onFinalize, loading }: StepReviewProps) => {
  const profBonus = calculateProficiencyBonus(data.level);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Review your character before finalizing. You can go back to make changes if needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{data.name || "Unnamed Character"}</CardTitle>
          <CardDescription>
            Level {data.level} {data.className}
            {data.subclassId && " • Subclass selected"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ability Scores */}
          <div>
            <h4 className="font-medium mb-3">Ability Scores</h4>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(data.abilityScores).map(([ability, score]) => {
                const modifier = calculateModifier(score);
                return (
                  <div key={ability} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-sm font-medium uppercase">{ability}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{score}</span>
                      <span className="text-sm text-muted-foreground">
                        ({modifier >= 0 ? '+' : ''}{modifier})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Method: {data.abilityMethod === "standard-array" ? "Standard Array" : 
                      data.abilityMethod === "point-buy" ? "Point Buy" : "Manual Entry"}
            </p>
          </div>

          <Separator />

          {/* Key Stats */}
          <div>
            <h4 className="font-medium mb-3">Key Statistics</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Proficiency Bonus</span>
                <span className="font-bold">+{profBonus}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Initiative</span>
                <span className="font-bold">
                  {calculateModifier(data.abilityScores.dex) >= 0 ? '+' : ''}
                  {calculateModifier(data.abilityScores.dex)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Proficiencies */}
          <div>
            <h4 className="font-medium mb-3">Proficiencies</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Skills: </span>
                {data.skills && data.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">None selected</span>
                )}
              </div>
              
              {data.languages && data.languages.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Languages: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Equipment */}
          <div>
            <h4 className="font-medium mb-3">Equipment</h4>
            {data.equipment && data.equipment.length > 0 ? (
              <div className="space-y-1 text-sm">
                {data.equipment.slice(0, 5).map((item, idx) => (
                  <div key={idx}>• {item.item_ref} ×{item.qty}</div>
                ))}
                {data.equipment.length > 5 && (
                  <div className="text-muted-foreground">+ {data.equipment.length - 5} more items</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No equipment selected</p>
            )}
          </div>

          {data.spells && data.spells.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Spells</h4>
                <p className="text-sm">{data.spells.length} spell(s) prepared</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-2">Ready to Finalize?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This will create your character with all the selected options. You can still edit it later.
              </p>
              <Button onClick={onFinalize} disabled={loading} size="lg" className="w-full">
                {loading ? "Creating Character..." : "Finalize Character"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepReview;
