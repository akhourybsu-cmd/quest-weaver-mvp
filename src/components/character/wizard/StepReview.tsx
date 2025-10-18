import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";

interface StepReviewProps {
  onFinalize: () => void;
  loading: boolean;
}

const StepReview = ({ onFinalize, loading }: StepReviewProps) => {
  const [draft] = useAtom(draftAtom);
  const profBonus = calculateProficiencyBonus(draft.level);

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
          <CardTitle className="text-2xl">{draft.name || "Unnamed Character"}</CardTitle>
          <CardDescription>
            Level {draft.level} {draft.className}
            {draft.subclassId && " • Subclass selected"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ability Scores */}
          <div>
            <h4 className="font-medium mb-3">Ability Scores</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {Object.entries(draft.abilityScores).map(([ability, score]) => {
                const modifier = calculateModifier(score);
                return (
                  <div key={ability} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-xs sm:text-sm font-medium uppercase">{ability}</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-bold text-sm sm:text-base">{score}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        ({modifier >= 0 ? '+' : ''}{modifier})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Key Stats */}
          <div>
            <h4 className="font-medium mb-3">Key Statistics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span className="text-muted-foreground text-xs sm:text-sm">Proficiency Bonus</span>
                <span className="font-bold">+{profBonus}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span className="text-muted-foreground text-xs sm:text-sm">Initiative</span>
                <span className="font-bold">
                  {calculateModifier(draft.abilityScores.DEX) >= 0 ? '+' : ''}
                  {calculateModifier(draft.abilityScores.DEX)}
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
                {draft.choices.skills && draft.choices.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.choices.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">None selected</span>
                )}
              </div>
              
              {draft.choices.languages && draft.choices.languages.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Languages: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.choices.languages.map((lang, idx) => (
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
            {draft.choices.equipmentBundleId ? (
              <p className="text-sm">Equipment bundle selected: {draft.choices.equipmentBundleId}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No equipment selected</p>
            )}
          </div>

          {draft.choices.spellsKnown && draft.choices.spellsKnown.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Spells</h4>
                <p className="text-sm">{draft.choices.spellsKnown.length} spell(s) known</p>
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
              <Button onClick={onFinalize} disabled={loading} size="lg" className="w-full text-sm sm:text-base">
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
