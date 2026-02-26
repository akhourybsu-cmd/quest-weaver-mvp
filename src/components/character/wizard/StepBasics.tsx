import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Sword } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAtom, useSetAtom } from "jotai";
import { 
  draftAtom, 
  setNameAtom, 
  setLevelAtom, 
  setClassAtom, 
  setSubclassAtom,
  applyGrantsAtom,
  replaceGrantsAtom,
  setNeedsAtom
} from "@/state/characterWizard";
import { SRD, type SrdClass, type SrdSubclass } from "@/lib/srd/SRDClient";
import { grantsFromClass, needsFromClass, grantsFromSubclass, emptyGrants } from "@/lib/rules/5eRules";
import { CLASS_LEVEL_UP_RULES } from "@/lib/rules/levelUpRules";

const StepBasics = () => {
  const [draft] = useAtom(draftAtom);
  const setName = useSetAtom(setNameAtom);
  const setLevel = useSetAtom(setLevelAtom);
  const setClass = useSetAtom(setClassAtom);
  const setSubclass = useSetAtom(setSubclassAtom);
  const applyGrants = useSetAtom(applyGrantsAtom);
  const replaceGrants = useSetAtom(replaceGrantsAtom);
  const setNeeds = useSetAtom(setNeedsAtom);

  const [classes, setClasses] = useState<SrdClass[]>([]);
  const [subclasses, setSubclasses] = useState<SrdSubclass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SrdClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SRD.classes().then(data => {
      setClasses(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (draft.classId && classes.length > 0) {
      const cls = classes.find(c => c.id === draft.classId);
      if (cls) {
        setSelectedClass(cls);
        SRD.subclasses(cls.id).then(setSubclasses);
      }
    }
  }, [draft.classId, classes]);

  const handleClassChange = async (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    setClass({ classId, className: cls.name });
    setSelectedClass(cls);

    // Reset grants then apply from class (prevents stacking on class switch)
    const grants = grantsFromClass(cls);
    replaceGrants(grants);

    // Set needs
    const needs = needsFromClass(cls);
    setNeeds(needs);

    // Load subclasses
    const subs = await SRD.subclasses(classId);
    setSubclasses(subs);
  };

  const handleSubclassChange = (subclassId: string) => {
    const subclass = subclasses.find(s => s.id === subclassId);
    if (!subclass) return;

    setSubclass(subclassId);

    // Auto-grant subclass features up to current level
    const grants = grantsFromSubclass(subclass, draft.level);
    applyGrants(grants);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading classes...</div>;
  }

  const minLevelForSubclass = 3;
  const canChooseSubclass = draft.level >= minLevelForSubclass && subclasses.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-cinzel font-semibold mb-2 text-brass tracking-wide flex items-center gap-2">
          <Sword className="h-5 w-5" />
          Basic Information
        </h3>
        <div className="h-px bg-gradient-to-r from-brass/50 via-brass/20 to-transparent mb-4" />
        <p className="text-sm text-muted-foreground mb-6">
          Start by choosing your character's name, class, and level. This will determine their core capabilities.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Character Name *</Label>
          <Input
            id="name"
            value={draft.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Level *</Label>
          <Input
            id="level"
            type="number"
            min={1}
            max={20}
            value={draft.level}
            onChange={(e) => { 
              const level = parseInt(e.target.value) || 1;
              setLevel(level);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="class">Class *</Label>
          <Select value={draft.classId} onValueChange={handleClassChange}>
            <SelectTrigger id="class">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClass && subclasses.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subclass">
              Subclass
              {!canChooseSubclass && (
                <Badge variant="outline" className="ml-2">
                  Unlocks at level {minLevelForSubclass}
                </Badge>
              )}
            </Label>
            <Select 
              value={draft.subclassId} 
              onValueChange={handleSubclassChange}
              disabled={!canChooseSubclass}
            >
              <SelectTrigger id="subclass">
                <SelectValue placeholder="Select a subclass (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subclasses.map((subclass) => (
                  <SelectItem key={subclass.id} value={subclass.id}>
                    {subclass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedClass && (
        <Card className="fantasy-border-ornaments">
          <CardHeader>
            <CardTitle className="text-base font-cinzel text-brass">{selectedClass.name} Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hit Die:</span>
                <span className="ml-2 font-medium">d{selectedClass.hit_die}</span>
              </div>
              {selectedClass.spellcasting_ability && (
                <div>
                  <span className="text-muted-foreground">Spellcasting:</span>
                  <span className="ml-2 font-medium">{selectedClass.spellcasting_ability}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Saving Throws:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(draft.grants.savingThrows).map(save => (
                  <Badge key={save} variant="secondary">
                    {save}
                  </Badge>
                ))}
              </div>
            </div>

            {draft.grants.armorProficiencies.size > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Armor:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(draft.grants.armorProficiencies).map(armor => (
                    <Badge key={armor} variant="outline">
                      {armor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {draft.grants.weaponProficiencies.size > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Weapons:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(draft.grants.weaponProficiencies).map(weapon => (
                    <Badge key={weapon} variant="outline">
                      {weapon}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepBasics;
