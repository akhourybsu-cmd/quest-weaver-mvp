import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Heart, Shield, Zap, BookOpen } from "lucide-react";
import { calculateModifier, calculateProficiencyBonus, DND_CLASSES } from "@/lib/dnd5e";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD } from "@/lib/srd/SRDClient";
import { getEquipmentBundlesForClass } from "@/data/srd/equipmentBundlesSeed";

interface StepReviewProps {
  onFinalize: () => void;
  loading: boolean;
}

const StepReview = ({ onFinalize, loading }: StepReviewProps) => {
  const [draft] = useAtom(draftAtom);
  const [ancestryName, setAncestryName] = useState<string>("");
  const [backgroundName, setBackgroundName] = useState<string>("");
  const [subclassName, setSubclassName] = useState<string>("");
  const [spellNames, setSpellNames] = useState<string[]>([]);

  const profBonus = calculateProficiencyBonus(draft.level);
  const conMod = calculateModifier(draft.abilityScores.CON);
  const dexMod = calculateModifier(draft.abilityScores.DEX);
  const wisMod = calculateModifier(draft.abilityScores.WIS);

  // Get class hit die
  const classData = DND_CLASSES.find(c => c.value === draft.className);
  const hitDie = classData?.hitDie || 8;

  // Calculate HP: At level 1, max hit die + CON modifier
  const maxHP = hitDie + conMod;

  // Calculate base AC (unarmored)
  const baseAC = 10 + dexMod;

  // Calculate passive perception
  const passivePerception = 10 + wisMod + (draft.choices.skills.includes("Perception") ? profBonus : 0);

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
        <p className="text-sm text-muted-foreground">
          Review your character before finalizing. You can go back to make changes if needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{draft.name || "Unnamed Character"}</CardTitle>
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
              HP = d{hitDie} (max) + CON mod ({conMod >= 0 ? '+' : ''}{conMod}) • Passive Perception: {passivePerception}
            </p>
          </div>

          <Separator />

          {/* Ability Scores */}
          <div>
            <h4 className="font-medium mb-3">Ability Scores</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(draft.abilityScores).map(([ability, score]) => {
                const modifier = calculateModifier(score);
                return (
                  <div key={ability} className="flex flex-col items-center p-2 rounded bg-muted/50">
                    <span className="text-xs font-medium uppercase text-muted-foreground">{ability}</span>
                    <span className="text-xl font-bold">{score}</span>
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
              {draft.choices.skills.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.choices.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {draft.choices.languages.length > 0 && (
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
          {Object.keys(draft.choices.featureChoices).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Feature Choices</h4>
                <div className="space-y-1">
                  {Object.entries(draft.choices.featureChoices).map(([featureId, choices]) => (
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
