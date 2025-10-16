import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { calculateMaxHP, calculateAC } from "@/lib/characterRules";
import type { WizardData } from "../CharacterWizard";

interface LiveSummaryPanelProps {
  data: WizardData;
}

const LiveSummaryPanel = ({ data }: LiveSummaryPanelProps) => {
  const profBonus = calculateProficiencyBonus(data.level);
  const conMod = calculateModifier(data.abilityScores.con);
  
  // Estimate HP (will need class hit die)
  const estimatedHP = calculateMaxHP(data.level, 8, data.abilityScores.con); // Default d8
  
  // Calculate AC (unarmored)
  const baseAC = calculateAC(data.abilityScores.dex);

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
            <span className="font-medium">{data.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level</span>
            <span className="font-medium">{data.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium">{data.className || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ability Modifiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          {Object.entries(data.abilityScores).map(([ability, score]) => {
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
              {calculateModifier(data.abilityScores.dex) >= 0 ? '+' : ''}
              {calculateModifier(data.abilityScores.dex)}
            </span>
          </div>
        </CardContent>
      </Card>

      {data.skills && data.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {data.skills.slice(0, 8).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {data.skills.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{data.skills.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {data.spells && data.spells.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Spells</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.spells.length} prepared</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveSummaryPanel;
