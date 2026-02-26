import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { computeTotalHP } from "@/lib/hpCalculation";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD } from "@/lib/srd/SRDClient";
import { Heart, Shield, Zap, User } from "lucide-react";

const LiveSummaryPanel = () => {
  const [draft] = useAtom(draftAtom);
  const [ancestryName, setAncestryName] = useState<string>("");
  const [backgroundName, setBackgroundName] = useState<string>("");

  const abilityBonuses = draft.grants.abilityBonuses || {};
  const profBonus = calculateProficiencyBonus(draft.level);
  
  // Apply ancestry bonuses to DEX for AC/Initiative
  const dexBonus = abilityBonuses['dex'] || abilityBonuses['DEX'] || abilityBonuses['Dex'] || 0;
  const effectiveDex = draft.abilityScores.DEX + dexBonus;
  const dexMod = calculateModifier(effectiveDex);

  // Full HP calculation including all levels and ancestry bonuses
  const levelChoices = draft.choices?.featureChoices?.levelChoices;
  const maxHP = computeTotalHP(draft.className, draft.level, draft.abilityScores.CON, levelChoices, abilityBonuses);

  const baseAC = 10 + dexMod;

  // Completion tracking
  const completionSteps = [
    { name: "Name", done: !!draft.name },
    { name: "Class", done: !!draft.classId },
    { name: "Ancestry", done: !!draft.ancestryId },
    { name: "Background", done: !!draft.backgroundId },
    { name: "Abilities", done: Object.values(draft.abilityScores).some(v => v !== 10) },
    { name: "Skills", done: draft.choices.skills.length > 0 },
    { name: "Equipment", done: !!draft.choices.equipmentBundleId },
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  // Load ancestry/background names
  useEffect(() => {
    const loadNames = async () => {
      if (draft.ancestryId) {
        const ancestries = await SRD.ancestries();
        const ancestry = ancestries.find(a => a.id === draft.ancestryId);
        setAncestryName(ancestry?.name || "");
      }
      if (draft.backgroundId) {
        const backgrounds = await SRD.backgrounds();
        const background = backgrounds.find(b => b.id === draft.backgroundId);
        setBackgroundName(background?.name || "");
      }
    };
    loadNames();
  }, [draft.ancestryId, draft.backgroundId]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="font-cinzel font-bold text-lg mb-1 text-brass tracking-wide">Character Summary</h3>
        <div className="h-px bg-gradient-to-r from-brass/50 via-brass/20 to-transparent mb-1" />
        <p className="text-xs text-muted-foreground">
          Updates as you make selections
        </p>
      </div>

      {/* Progress */}
      <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '0ms' }}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-cinzel font-medium text-brass">Progress</span>
            <span className="text-sm text-muted-foreground">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-brass/70 [&>div]:to-brass" />
          <div className="flex flex-wrap gap-1 mt-2">
            {completionSteps.map((step, idx) => (
              <Badge 
                key={idx} 
                variant={step.done ? "default" : "outline"} 
                className={`text-xs ${step.done ? 'bg-brass/80 text-brass-foreground hover:bg-brass/70' : 'border-brass/30'}`}
              >
                {step.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Character Identity */}
      <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-cinzel flex items-center gap-2 text-brass">
            <User className="h-4 w-4" />
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm pb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium truncate max-w-[120px]">{draft.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level</span>
            <span className="font-medium">{draft.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium">{draft.className || "—"}</span>
          </div>
          {ancestryName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ancestry</span>
              <span className="font-medium">{ancestryName}</span>
            </div>
          )}
          {backgroundName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Background</span>
              <span className="font-medium truncate max-w-[100px]">{backgroundName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combat Stats */}
      <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-cinzel flex items-center gap-2 text-brass">
            <Zap className="h-4 w-4" />
            Combat
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center p-2 rounded bg-destructive/10 border border-destructive/20">
              <Heart className="h-4 w-4 text-destructive mb-1" />
              <span className="text-lg font-bold">{maxHP}</span>
              <span className="text-xs text-muted-foreground">HP</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded bg-brass/10 border border-brass/20">
              <Shield className="h-4 w-4 text-brass mb-1" />
              <span className="text-lg font-bold">{baseAC}</span>
              <span className="text-xs text-muted-foreground">AC</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-muted-foreground text-xs">Prof</span>
              <span className="font-bold">+{profBonus}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-muted/50">
              <span className="text-muted-foreground text-xs">Init</span>
              <span className="font-bold">{dexMod >= 0 ? '+' : ''}{dexMod}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ability Modifiers (with ancestry bonuses) */}
      <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-cinzel text-brass">Ability Modifiers</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(draft.abilityScores).map(([ability, score]) => {
              const bonus = abilityBonuses[ability.toLowerCase()] || abilityBonuses[ability] || 0;
              const effective = score + bonus;
              const modifier = calculateModifier(effective);
              return (
                <div key={ability} className="flex flex-col items-center p-1 rounded bg-muted/30 border border-brass/10">
                  <span className="text-xs uppercase text-muted-foreground">{ability}</span>
                  <span className="font-mono font-bold text-sm">
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </span>
                  {bonus > 0 && (
                    <span className="text-[10px] text-primary">+{bonus}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {draft.choices.skills.length > 0 && (
        <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-cinzel text-brass">Skills ({draft.choices.skills.length})</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-1">
              {draft.choices.skills.slice(0, 6).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs" style={{ animationDelay: `${idx * 30}ms` }}>
                  {skill}
                </Badge>
              ))}
              {draft.choices.skills.length > 6 && (
                <Badge variant="outline" className="text-xs border-brass/30">
                  +{draft.choices.skills.length - 6}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spells */}
      {draft.choices.spellsKnown.length > 0 && (
        <Card className="border-brass/20 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-cinzel text-brass">Spells</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm">{draft.choices.spellsKnown.length} spell(s) selected</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveSummaryPanel;
