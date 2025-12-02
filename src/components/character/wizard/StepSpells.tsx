import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAtom, useSetAtom } from "jotai";
import { draftAtom, toggleSpellKnownAtom, toggleSpellPreparedAtom } from "@/state/characterWizard";
import { SRD, type SrdClass, type SrdSubclass, type SrdSpell } from "@/lib/srd/SRDClient";
import {
  getSpellSlotInfo,
  getClassSpellAccess,
  getCantripCount,
  getKnownPreparedModel,
  getLegalSpellPool,
  isAutoPrepared,
  getCantripScalingBreakpoint,
  spellHasCostlyComponents,
  type ClassSpellAccess,
} from "@/lib/rules/spellRules";
import { AlertCircle, BookOpen, Sparkles, Zap } from "lucide-react";

const StepSpells = () => {
  const [draft] = useAtom(draftAtom);
  const toggleKnown = useSetAtom(toggleSpellKnownAtom);
  const togglePrepared = useSetAtom(toggleSpellPreparedAtom);

  const [selectedClass, setSelectedClass] = useState<SrdClass | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<SrdSubclass | null>(null);
  const [allSpells, setAllSpells] = useState<SrdSpell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("cantrips");

  // Load class, subclass, and spells
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const classes = await SRD.classes();
        const cls = classes.find((c) => c.id === draft.classId);
        setSelectedClass(cls || null);

        if (draft.subclassId && cls) {
          const subclasses = await SRD.subclasses(cls.id);
          const sub = subclasses.find((s) => s.id === draft.subclassId);
          setSelectedSubclass(sub || null);
        }

        if (cls) {
          console.log("Loading spells for class:", cls.name);
          const spells = await SRD.spellsByClass(cls.name);
          console.log("Loaded spells:", spells.length, spells.slice(0, 3));
          setAllSpells(spells);
          
          if (spells.length === 0) {
            console.warn("No spells found for class:", cls.name);
          }
        }
      } catch (error) {
        console.error("Failed to load spell data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (draft.classId) {
      loadData();
    }
  }, [draft.classId, draft.subclassId]);

  // Compute spell slot info
  const slotInfo = useMemo(() => {
    if (!selectedClass) return null;
    return getSpellSlotInfo([{ className: selectedClass.name, level: draft.level }]);
  }, [selectedClass, draft.level]);

  // Compute class spell access
  const spellAccess = useMemo<ClassSpellAccess | null>(() => {
    if (!selectedClass) return null;
    return getClassSpellAccess(selectedClass, selectedSubclass || undefined);
  }, [selectedClass, selectedSubclass]);

  // Compute known/prepared model
  const knownPreparedModel = useMemo(() => {
    if (!selectedClass) return null;
    const abilityMod = Math.floor((draft.abilityScores.WIS - 10) / 2); // Default to WIS, adjust per class
    return getKnownPreparedModel(selectedClass.name, draft.level, abilityMod);
  }, [selectedClass, draft.level, draft.abilityScores]);

  // Max spell level
  const maxSpellLevel = useMemo(() => {
    if (!slotInfo) return 0;
    if (slotInfo.pact && !slotInfo.shared) {
      return slotInfo.pact.pactSlotLevel;
    }
    return slotInfo.shared?.maxSpellLevel || 0;
  }, [slotInfo]);

  // Legal spell pool
  const legalSpells = useMemo(() => {
    if (!spellAccess) return [];
    return getLegalSpellPool(allSpells, spellAccess, maxSpellLevel);
  }, [allSpells, spellAccess, maxSpellLevel]);

  // Cantrips
  const cantrips = useMemo(() => {
    return legalSpells.filter((s) => s.level === 0);
  }, [legalSpells]);

  // Leveled spells
  const leveledSpells = useMemo(() => {
    return legalSpells.filter((s) => (s.level || 0) > 0);
  }, [legalSpells]);

  // Cantrip count
  const cantripCount = useMemo(() => {
    if (!selectedClass) return 0;
    return getCantripCount(selectedClass.name, draft.level);
  }, [selectedClass, draft.level]);

  // Filter spells by search and level
  const filteredCantrips = useMemo(() => {
    return cantrips.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cantrips, searchTerm]);

  const filteredLeveledSpells = useMemo(() => {
    const filtered = leveledSpells.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by level
    const grouped: Record<number, SrdSpell[]> = {};
    for (const spell of filtered) {
      const lvl = spell.level || 1;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(spell);
    }
    return grouped;
  }, [leveledSpells, searchTerm]);

  // Auto-prepared spells
  const autoPreparedSpells = useMemo(() => {
    if (!spellAccess) return [];
    return spellAccess.autoPrepared;
  }, [spellAccess]);

  // Validation
  const selectedCantrips = draft.choices.spellsKnown.filter((id) =>
    cantrips.some((c) => c.id === id)
  );
  const selectedLeveled = draft.choices.spellsKnown.filter((id) =>
    leveledSpells.some((s) => s.id === id)
  );
  const selectedPrepared = draft.choices.spellsPrepared;

  const cantripValid = selectedCantrips.length === cantripCount;
  const leveledValid = useMemo(() => {
    if (!knownPreparedModel) return false;
    if (knownPreparedModel.model === "known") {
      return selectedLeveled.length === (knownPreparedModel.knownMax || 0);
    } else {
      const preparedCount = selectedPrepared.length;
      const autoPreparedCount = autoPreparedSpells.length;
      const totalPrepared = preparedCount + autoPreparedCount;
      return preparedCount <= (knownPreparedModel.preparedMax || 0);
    }
  }, [knownPreparedModel, selectedLeveled, selectedPrepared, autoPreparedSpells]);

  const isValid = cantripValid && leveledValid;

  if (loading || !selectedClass) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading spell data...</p>
      </div>
    );
  }

  if (!slotInfo || !spellAccess || !knownPreparedModel) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {selectedClass.name} is not a spellcasting class.
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if no spells found for the class
  if (allSpells.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-medium">No spells found for {selectedClass.name}</p>
          <p className="text-sm">
            The spell database may need to be re-imported. Please visit{" "}
            <a href="/admin" className="underline font-medium">Admin Tools</a>{" "}
            and click "Fix Spell Data" to resolve this issue.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Spellcasting Summary
          </CardTitle>
          <CardDescription>
            {selectedClass.name} {draft.level} ({knownPreparedModel.model === "prepared" ? "Prepared" : "Known"})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slot info */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Max spell level: <Badge variant="secondary">{maxSpellLevel}</Badge>
            </p>
            {slotInfo.shared && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Slots:</span>
                {Object.entries(slotInfo.shared.slots).map(([level, count]) => (
                  <Badge key={level} variant="outline">
                    {level}st: {count}
                  </Badge>
                ))}
              </div>
            )}
            {slotInfo.pact && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Pact Magic:</span>
                <Badge variant="outline">
                  {slotInfo.pact.pactSlots}× Level {slotInfo.pact.pactSlotLevel}
                </Badge>
              </div>
            )}
          </div>

          {/* Additional info */}
          <div className="flex flex-wrap gap-2">
            {spellAccess.hasRitualCasting && (
              <Badge variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                Ritual Casting
              </Badge>
            )}
            {spellAccess.usesFocus && (
              <Badge variant="secondary">
                Focus: {spellAccess.usesFocus}
              </Badge>
            )}
            <Badge variant="outline">
              Cantrip scaling: {getCantripScalingBreakpoint(draft.level)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Validation warnings */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!cantripValid && (
              <p>
                Cantrips: {selectedCantrips.length}/{cantripCount} selected. Select exactly {cantripCount}.
              </p>
            )}
            {!leveledValid && knownPreparedModel.model === "known" && (
              <p>
                Spells Known: {selectedLeveled.length}/{knownPreparedModel.knownMax} selected.
              </p>
            )}
            {!leveledValid && knownPreparedModel.model === "prepared" && (
              <p>
                Prepared: {selectedPrepared.length}/{knownPreparedModel.preparedMax} (+ {autoPreparedSpells.length} auto-prepared).
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Input
        placeholder="Search spells..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${maxSpellLevel + 1}, 1fr)` }}>
          <TabsTrigger value="cantrips">
            Cantrips
            <Badge variant="outline" className="ml-2">
              {selectedCantrips.length}/{cantripCount}
            </Badge>
          </TabsTrigger>
          {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((lvl) => (
            <TabsTrigger key={lvl} value={`level-${lvl}`}>
              {lvl}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Cantrips tab */}
        <TabsContent value="cantrips">
          <Card>
            <CardHeader>
              <CardTitle>
                Cantrips ({selectedCantrips.length}/{cantripCount})
              </CardTitle>
              <CardDescription>
                Select {cantripCount} cantrips from the {selectedClass.name} list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredCantrips.map((spell) => (
                    <SpellRow
                      key={spell.id}
                      spell={spell}
                      selected={selectedCantrips.includes(spell.id)}
                      onToggle={() => toggleKnown(spell.id)}
                      disabled={
                        !selectedCantrips.includes(spell.id) &&
                        selectedCantrips.length >= cantripCount
                      }
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leveled spell tabs */}
        {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((lvl) => (
          <TabsContent key={lvl} value={`level-${lvl}`}>
            <Card>
              <CardHeader>
                <CardTitle>Level {lvl} Spells</CardTitle>
                <CardDescription>
                  {knownPreparedModel.model === "known"
                    ? `Spells Known: ${selectedLeveled.length}/${knownPreparedModel.knownMax}`
                    : `Prepared: ${selectedPrepared.length}/${knownPreparedModel.preparedMax} (+ ${autoPreparedSpells.length} auto-prepared)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Auto-prepared section */}
                {knownPreparedModel.model === "prepared" &&
                  autoPreparedSpells.filter((s) => s.level === lvl).length > 0 && (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Always Prepared (Domain/Oath/Circle)</p>
                        <div className="space-y-2">
                          {autoPreparedSpells
                            .filter((s) => s.level === lvl)
                            .map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                              >
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{s.name}</span>
                                <Badge variant="outline" className="ml-auto">
                                  Auto-prepared
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </>
                  )}

                {/* Regular spells */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {(filteredLeveledSpells[lvl] || []).map((spell) => {
                      const isAuto = isAutoPrepared(spell.id, spellAccess);
                      if (isAuto) return null; // Skip auto-prepared in main list

                      const isSelected =
                        knownPreparedModel.model === "known"
                          ? selectedLeveled.includes(spell.id)
                          : selectedPrepared.includes(spell.id);

                      const disabled =
                        knownPreparedModel.model === "known"
                          ? !isSelected && selectedLeveled.length >= (knownPreparedModel.knownMax || 0)
                          : !isSelected && selectedPrepared.length >= (knownPreparedModel.preparedMax || 0);

                      return (
                        <SpellRow
                          key={spell.id}
                          spell={spell}
                          selected={isSelected}
                          onToggle={() => {
                            if (knownPreparedModel.model === "known") {
                              toggleKnown(spell.id);
                            } else {
                              togglePrepared(spell.id);
                            }
                          }}
                          disabled={disabled}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Ready indicator */}
      {isValid && (
        <Alert>
          <AlertDescription className="text-green-600">
            ✓ Spell selection complete! You can proceed to the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Spell row component
function SpellRow({
  spell,
  selected,
  onToggle,
  disabled,
}: {
  spell: SrdSpell;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const hasCostly = spellHasCostlyComponents(spell);

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
        selected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={() => !disabled && onToggle()}
    >
      <Checkbox checked={selected} disabled={disabled} />
      <div className="flex-1">
        <p className="font-medium">{spell.name || "(Unnamed spell)"}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {typeof spell.school === 'string' ? spell.school : (spell.school?.name || "Unknown")}
          </Badge>
          {spell.ritual && (
            <Badge variant="secondary" className="text-xs">
              Ritual
            </Badge>
          )}
          {spell.concentration && (
            <Badge variant="secondary" className="text-xs">
              Concentration
            </Badge>
          )}
          {hasCostly && (
            <Badge variant="destructive" className="text-xs">
              Costly components
            </Badge>
          )}
        </div>
        {!spell.name && (
          <p className="text-xs text-destructive mt-1">
            ID: {spell.id}
          </p>
        )}
      </div>
    </div>
  );
}

export default StepSpells;
