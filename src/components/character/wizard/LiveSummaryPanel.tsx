import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { calculateMaxHP, calculateAC } from "@/lib/characterRules";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";

const LiveSummaryPanel = () => {
  const [draft] = useAtom(draftAtom);
  const profBonus = calculateProficiencyBonus(draft.level);
  const conMod = calculateModifier(draft.abilityScores.CON);
  
  // Estimate HP (will need class hit die)
  const estimatedHP = calculateMaxHP(draft.level, 8, draft.abilityScores.CON); // Default d8
  
  // Calculate AC (unarmored)
  const baseAC = calculateAC(draft.abilityScores.DEX);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div>
        <h3 className="font-bold text-lg mb-2">Live Summary</h3>
        <p className="text-xs text-muted-foreground">
          Updates as you make selections
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Character Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{draft.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level</span>
            <span className="font-medium">{draft.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium">{draft.className || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ability Modifiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          {Object.entries(draft.abilityScores).map(([ability, score]) => {
            const modifier = calculateModifier(score);
            return (
              <div key={ability} className="flex justify-between">
                <span className="uppercase">{ability}</span>
                <span className="font-mono font-bold">
                  {modifier >= 0 ? '+' : ''}{modifier}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Combat Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">HP (est)</span>
            <span className="font-bold">{estimatedHP}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AC (base)</span>
            <span className="font-bold">{baseAC}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prof Bonus</span>
            <span className="font-bold">+{profBonus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Initiative</span>
            <span className="font-bold">
              {calculateModifier(draft.abilityScores.DEX) >= 0 ? '+' : ''}
              {calculateModifier(draft.abilityScores.DEX)}
            </span>
          </div>
        </CardContent>
      </Card>

      {draft.choices.skills && draft.choices.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {draft.choices.skills.slice(0, 8).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {draft.choices.skills.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{draft.choices.skills.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {draft.choices.spellsKnown && draft.choices.spellsKnown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Spells</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{draft.choices.spellsKnown.length} known</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveSummaryPanel;
