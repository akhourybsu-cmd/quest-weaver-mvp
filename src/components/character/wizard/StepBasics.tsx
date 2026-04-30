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
  setSourceGrantsAtom,
  setNeedsAtom
} from "@/state/characterWizard";
import { SRD, type SrdClass, type SrdSubclass } from "@/lib/srd/SRDClient";
import { grantsFromClass, needsFromClass, grantsFromSubclass, emptyGrants, mergeGrants } from "@/lib/rules/5eRules";
import { CLASS_LEVEL_UP_RULES } from "@/lib/rules/levelUpRules";

const StepBasics = () => {
  const [draft] = useAtom(draftAtom);
  const setName = useSetAtom(setNameAtom);
  const setLevel = useSetAtom(setLevelAtom);
  const setClass = useSetAtom(setClassAtom);
  const setSubclass = useSetAtom(setSubclassAtom);
  const setSourceGrants = useSetAtom(setSourceGrantsAtom);
  const setNeeds = useSetAtom(setNeedsAtom);

  const [classes, setClasses] = useState<SrdClass[]>([]);
  const [subclasses, setSubclasses] = useState<SrdSubclass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SrdClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelInput, setLevelInput] = useState<string>(String(draft.level ?? 1));

  // Sync local string state when draft.level changes externally (e.g. wizard reset)
  useEffect(() => {
    setLevelInput((prev) => {
      const parsed = parseInt(prev, 10);
      return parsed === draft.level ? prev : String(draft.level);
    });
  }, [draft.level]);

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

    // Use source-tracked grants (replaces old class grants cleanly)
    const grants = grantsFromClass(cls);
    setSourceGrants({ source: 'class', grants });

    // Set class-specific needs only (preserve background needs)
    const needs = needsFromClass(cls);
    setNeeds({ skill: needs.skill, tool: needs.tool });

    // Load subclasses
    const subs = await SRD.subclasses(classId);
    setSubclasses(subs);
  };

  const handleSubclassChange = (subclassId: string) => {
    const subclass = subclasses.find(s => s.id === subclassId);
    if (!subclass) return;

    setSubclass(subclassId);

    // BUG FIX: Only merge subclass grants if we have a selected class
    if (selectedClass) {
      // Subclass features go into the class source (they're class-derived)
      const subGrants = grantsFromSubclass(subclass, draft.level);
      const classGrants = grantsFromClass(selectedClass);
      setSourceGrants({ source: 'class', grants: mergeGrants(classGrants, subGrants) });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading classes...</div>;
  }

  // Dynamic subclass unlock level per class
  const minLevelForSubclass = selectedClass 
    ? (CLASS_LEVEL_UP_RULES[selectedClass.name]?.subclassLevel ?? 3) 
    : 3;
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
            inputMode="numeric"
            value={levelInput}
            onChange={(e) => {
              const raw = e.target.value;
              // Allow empty or digit-only strings while typing
              if (raw === "" || /^\d+$/.test(raw)) {
                setLevelInput(raw);
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
                  setLevel(parsed);
                }
              }
            }}
            onBlur={() => {
              const parsed = parseInt(levelInput, 10);
              if (isNaN(parsed)) {
                // Restore last committed level
                setLevelInput(String(draft.level));
                return;
              }
              const clamped = Math.max(1, Math.min(20, parsed));
              setLevel(clamped);
              setLevelInput(String(clamped));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Level 1–20</p>
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
