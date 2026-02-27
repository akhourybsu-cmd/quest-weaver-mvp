import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Heart, Shield, Zap, BookOpen, Sparkles, CheckCircle, TrendingUp } from "lucide-react";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { computeTotalHP } from "@/lib/hpCalculation";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD } from "@/lib/srd/SRDClient";
import { getEquipmentBundlesForClass } from "@/data/srd/equipmentBundlesSeed";

interface StepReviewProps {
  onFinalize: () => void;
  loading: boolean;
}

function getEffectiveScore(base: number, ability: string, bonuses: Record<string, number>): number {
  const bonus = bonuses[ability.toLowerCase()] || bonuses[ability.toUpperCase()] || bonuses[ability] || 0;
  return base + bonus;
}

const StepReview = ({ onFinalize, loading }: StepReviewProps) => {
  const [draft] = useAtom(draftAtom);
  const [ancestryName, setAncestryName] = useState<string>("");
  const [backgroundName, setBackgroundName] = useState<string>("");
  const [subclassName, setSubclassName] = useState<string>("");
  const [spellNames, setSpellNames] = useState<string[]>([]);

  const abilityBonuses = draft.grants.abilityBonuses || {};
  const profBonus = calculateProficiencyBonus(draft.level);
  
  const effectiveDex = getEffectiveScore(draft.abilityScores.DEX, 'DEX', abilityBonuses);
  const effectiveWis = getEffectiveScore(draft.abilityScores.WIS, 'WIS', abilityBonuses);
  const dexMod = calculateModifier(effectiveDex);
  const wisMod = calculateModifier(effectiveWis);

  // Full HP calculation including all levels and ancestry bonuses
  const levelChoices = draft.choices?.featureChoices?.levelChoices;
  const maxHP = computeTotalHP(draft.className, draft.level, draft.abilityScores.CON, levelChoices, abilityBonuses);

  const baseAC = 10 + dexMod;
  const allSkillsForPassive = new Set([
    ...Array.from(draft.grants.skillProficiencies || []),
    ...draft.choices.skills,
  ]);
  const passivePerception = 10 + wisMod + (allSkillsForPassive.has("Perception") ? profBonus : 0);

  // Get selected equipment bundle items
  const equipmentData = draft.className ? getEquipmentBundlesForClass(draft.className) : undefined;
  const selectedBundle = equipmentData?.bundles.find(b => b.id === draft.choices.equipmentBundleId);

  // Load names for IDs
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

      if (draft.subclassId && draft.classId) {
        const subclasses = await SRD.subclasses(draft.classId);
        const subclass = subclasses.find(s => s.id === draft.subclassId);
        setSubclassName(subclass?.name || "");
      }

      if (draft.choices.spellsKnown.length > 0) {
        const allSpells = await SRD.allSpells();
        const names = draft.choices.spellsKnown
          .map(id => allSpells.find(s => s.id === id)?.name)
          .filter(Boolean) as string[];
        setSpellNames(names);
      }
    };

    loadNames();
  }, [draft.ancestryId, draft.backgroundId, draft.subclassId, draft.classId, draft.choices.spellsKnown]);

  // Parse level-up choices for display
  const levelChoicesSummary: Array<{ level: number; items: string[] }> = [];
  if (levelChoices && typeof levelChoices === 'object') {
    const entries = Array.isArray(levelChoices) 
      ? levelChoices.map((lc: any, i: number) => [lc.level || i + 2, lc])
      : Object.entries(levelChoices);
    
    for (const [lvlKey, lc] of entries) {
      if (!lc) continue;
      const lvl = Number(lvlKey);
      const items: string[] = [];
      const conMod = calculateModifier(getEffectiveScore(draft.abilityScores.CON, 'CON', abilityBonuses));
      
      if (lc.hpRoll !== undefined) {
        items.push(`HP: +${lc.hpRoll + conMod} (${lc.useAverage ? 'avg' : 'rolled'} ${lc.hpRoll} + ${conMod} CON)`);
      }
      if (lc.asiChoice === 'asi' && lc.abilityIncreases) {
        const increases = Object.entries(lc.abilityIncreases)
          .filter(([, v]) => (v as number) > 0)
          .map(([k, v]) => `${k} +${v}`);
        if (increases.length) items.push(`ASI: ${increases.join(', ')}`);
      }
      if (lc.asiChoice === 'feat' && lc.selectedFeat) items.push(`Feat: ${lc.selectedFeat}`);
      if (lc.fightingStyle) items.push(`Fighting Style: ${lc.fightingStyle}`);
      if (lc.expertise?.length) items.push(`Expertise: ${lc.expertise.join(', ')}`);
      if (lc.metamagic?.length) items.push(`Metamagic: ${lc.metamagic.join(', ')}`);
      if (lc.invocations?.length) items.push(`Invocations: ${lc.invocations.join(', ')}`);
      if (lc.pactBoon) items.push(`Pact Boon: ${lc.pactBoon}`);
      if (lc.favoredEnemy) items.push(`Favored Enemy: ${lc.favoredEnemy}`);
      if (lc.favoredTerrain) items.push(`Favored Terrain: ${lc.favoredTerrain}`);
      
      if (items.length > 0) {
        levelChoicesSummary.push({ level: lvl, items });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-cinzel font-semibold mb-2 text-brass tracking-wide flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Review & Confirm
        </h3>
        <div className="h-px bg-gradient-to-r from-brass/50 via-brass/20 to-transparent mb-4" />
        <p className="text-sm text-muted-foreground">
          Review your character before finalizing. You can go back to make changes if needed.
        </p>
      </div>

      <Card className="fantasy-border-ornaments">
        <CardHeader>
          <CardTitle className="text-2xl font-cinzel text-brass">{draft.name || "Unnamed Character"}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2 mt-1">
            <Badge variant="secondary">Level {draft.level}</Badge>
            {ancestryName && <Badge variant="outline">{ancestryName}</Badge>}
            <Badge>{draft.className}</Badge>
            {subclassName && <Badge variant="outline">{subclassName}</Badge>}
            {backgroundName && <Badge variant="outline">{backgroundName}</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Combat Stats */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Combat Statistics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Heart className="h-5 w-5 text-destructive mb-1" />
                <span className="text-2xl font-bold">{maxHP}</span>
                <span className="text-xs text-muted-foreground">Hit Points</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-5 w-5 text-primary mb-1" />
                <span className="text-2xl font-bold">{baseAC}</span>
                <span className="text-xs text-muted-foreground">Base AC</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                <span className="text-2xl font-bold">+{profBonus}</span>
                <span className="text-xs text-muted-foreground">Proficiency</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                <span className="text-2xl font-bold">{dexMod >= 0 ? '+' : ''}{dexMod}</span>
                <span className="text-xs text-muted-foreground">Initiative</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Passive Perception: {passivePerception}
            </p>
          </div>

          <Separator />

          {/* Ability Scores */}
          <div>
            <h4 className="font-medium mb-3">Ability Scores</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(draft.abilityScores).map(([ability, score]) => {
                const effectiveScore = getEffectiveScore(score, ability, abilityBonuses);
                const bonus = effectiveScore - score;
                const modifier = calculateModifier(effectiveScore);
                return (
                  <div key={ability} className="flex flex-col items-center p-2 rounded bg-muted/50">
                    <span className="text-xs font-medium uppercase text-muted-foreground">{ability}</span>
                    <span className="text-xl font-bold">
                      {effectiveScore}
                      {bonus > 0 && <span className="text-xs text-primary ml-0.5">+{bonus}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({modifier >= 0 ? '+' : ''}{modifier})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Proficiencies */}
          <div>
            <h4 className="font-medium mb-3">Proficiencies</h4>
            <div className="space-y-3">
              {/* All skills: granted + chosen */}
              {(draft.choices.skills.length > 0 || draft.grants.skillProficiencies.size > 0) && (
                <div>
                  <span className="text-sm text-muted-foreground">Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(draft.grants.skillProficiencies).map((skill, idx) => (
                      <Badge key={`g-${idx}`} variant="outline" className="text-xs border-primary/40">
                        {skill} <span className="text-muted-foreground ml-1">(granted)</span>
                      </Badge>
                    ))}
                    {draft.choices.skills
                      .filter(s => !draft.grants.skillProficiencies.has(s))
                      .map((skill, idx) => (
                        <Badge key={`c-${idx}`} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Saving Throws */}
              {draft.grants.savingThrows.size > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Saving Throws: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(draft.grants.savingThrows).map((save, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {save}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* All languages: granted + chosen */}
              {(() => {
                const allLangs = new Set([
                  ...Array.from(draft.grants.languages),
                  ...(draft.choices.languages || []),
                ]);
                return allLangs.size > 0 ? (
                  <div>
                    <span className="text-sm text-muted-foreground">Languages: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(allLangs).map((lang, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Tools: granted + chosen */}
              {(() => {
                const allTools = new Set([
                  ...Array.from(draft.grants.toolProficiencies),
                  ...(draft.choices.tools || []),
                ]);
                return allTools.size > 0 ? (
                  <div>
                    <span className="text-sm text-muted-foreground">Tools: </span>
                    <span className="text-sm">{Array.from(allTools).join(", ")}</span>
                  </div>
                ) : null;
              })()}

              {draft.grants.armorProficiencies && draft.grants.armorProficiencies.size > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Armor: </span>
                  <span className="text-sm">{Array.from(draft.grants.armorProficiencies).join(", ")}</span>
                </div>
              )}
              {draft.grants.weaponProficiencies && draft.grants.weaponProficiencies.size > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Weapons: </span>
                  <span className="text-sm">{Array.from(draft.grants.weaponProficiencies).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Equipment */}
          <div>
            <h4 className="font-medium mb-3">Starting Equipment</h4>
            {selectedBundle ? (
              <div className="flex flex-wrap gap-1">
                {selectedBundle.items.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {item.name}{item.qty && item.qty > 1 ? ` ×${item.qty}` : ""}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {draft.choices.equipmentBundleId || "Standard equipment"}
              </p>
            )}
          </div>

          {/* Spells */}
          {spellNames.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Spells Known ({spellNames.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {spellNames.map((name, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Feature Choices */}
          {Object.keys(draft.choices.featureChoices).filter(k => k !== 'levelChoices').length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Feature Choices</h4>
                <div className="space-y-1">
                  {Object.entries(draft.choices.featureChoices)
                    .filter(([key]) => key !== 'levelChoices')
                    .map(([featureId, choices]) => (
                      <div key={featureId} className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {Array.isArray(choices) ? choices.join(", ") : choices}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Level-Up Choices Summary */}
          {levelChoicesSummary.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Level-Up Choices
                </h4>
                <div className="space-y-2">
                  {levelChoicesSummary.map(({ level, items }) => (
                    <div key={level} className="text-sm">
                      <span className="font-medium text-muted-foreground">Level {level}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {items.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-brass/50 bg-gradient-to-br from-brass/10 to-brass/5 shadow-[0_0_12px_hsl(var(--brass)/0.3)] animate-pulse-breathe">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-brass/20 p-2">
              <Sparkles className="h-5 w-5 text-brass" />
            </div>
            <div className="flex-1">
              <h4 className="font-cinzel font-medium mb-2 text-brass">Ready to Finalize?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This will create your character with all the selected options. You can still edit it later.
              </p>
              <Button onClick={onFinalize} disabled={loading} size="lg" className="w-full bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-brass-foreground active:scale-95 transition-all">
                <Sparkles className="mr-2 h-4 w-4" />
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
