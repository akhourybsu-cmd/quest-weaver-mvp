import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpellPreparationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterClass: string;
  level: number;
  spellcastingAbility: string;
}

export const SpellPreparationManager = ({
  open,
  onOpenChange,
  characterId,
  characterClass,
  level,
  spellcastingAbility
}: SpellPreparationManagerProps) => {
  const [knownSpells, setKnownSpells] = useState<any[]>([]);
  const [preparedSpells, setPreparedSpells] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calculate max prepared spells based on class
  const getMaxPreparedSpells = () => {
    const abilityScore = 13; // TODO: Get from character abilities
    const abilityMod = Math.floor((abilityScore - 10) / 2);
    
    // Clerics, Druids, Paladins: Level + ability mod (min 1)
    if (["Cleric", "Druid", "Paladin"].includes(characterClass)) {
      return Math.max(1, level + abilityMod);
    }
    
    // Wizards prepare level + INT mod (min 1)
    if (characterClass === "Wizard") {
      return Math.max(1, level + abilityMod);
    }
    
    // Other classes don't prepare spells (they know them)
    return null;
  };

  const maxPrepared = getMaxPreparedSpells();
  const canPrepareSpells = maxPrepared !== null;

  useEffect(() => {
    if (open) {
      loadSpells();
    }
  }, [open, characterId]);

  const loadSpells = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("character_spells")
        .select(`
          *,
          srd_spells!inner(*)
        `)
        .eq("character_id", characterId)
        .eq("known", true);

      if (error) throw error;

      setKnownSpells(data || []);
      setPreparedSpells(
        data?.filter((s: any) => s.prepared).map((s: any) => s.id) || []
      );
    } catch (error) {
      console.error("Error loading spells:", error);
      toast.error("Failed to load spells");
    } finally {
      setLoading(false);
    }
  };

  const toggleSpellPrepared = (spellId: string) => {
    if (preparedSpells.includes(spellId)) {
      setPreparedSpells(preparedSpells.filter(id => id !== spellId));
    } else {
      if (maxPrepared && preparedSpells.length >= maxPrepared) {
        toast.error(`You can only prepare ${maxPrepared} spells`);
        return;
      }
      setPreparedSpells([...preparedSpells, spellId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all spells to unprepared
      const { error: unprepareError } = await supabase
        .from("character_spells")
        .update({ 
          prepared: false,
          preparation_date: null
        })
        .eq("character_id", characterId);

      if (unprepareError) throw unprepareError;

      // Update prepared spells
      if (preparedSpells.length > 0) {
        const { error: prepareError } = await supabase
          .from("character_spells")
          .update({ 
            prepared: true,
            preparation_date: new Date().toISOString()
          })
          .in("id", preparedSpells);

        if (prepareError) throw prepareError;
      }

      // Record preparation session
      const { error: sessionError } = await supabase
        .from("spell_preparation_sessions")
        .insert({
          character_id: characterId,
          spell_ids: preparedSpells
        });

      if (sessionError) throw sessionError;

      toast.success("Spells prepared successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving prepared spells:", error);
      toast.error("Failed to save prepared spells");
    } finally {
      setSaving(false);
    }
  };

  if (!canPrepareSpells) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spell Preparation</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {characterClass}s don't prepare spells - they know their spells automatically.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  const spellsByLevel = knownSpells.reduce((acc: any, spell: any) => {
    const level = spell.srd_spells.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(spell);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle>Prepare Spells</DialogTitle>
            </div>
            <Badge variant={preparedSpells.length === maxPrepared ? "default" : "secondary"}>
              {preparedSpells.length} / {maxPrepared} Prepared
            </Badge>
          </div>
          <DialogDescription>
            Select which spells to prepare for the day. You can prepare {maxPrepared} spells.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading spells...</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {Object.entries(spellsByLevel).map(([level, spells]: [string, any]) => (
                <Card key={level}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {level === "0" ? "Cantrips" : `Level ${level}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {spells.map((spell: any) => {
                      const isPrepared = preparedSpells.includes(spell.id);
                      const isCantrip = spell.srd_spells.level === 0;
                      const isAlwaysPrepared = spell.is_always_prepared;

                      return (
                        <div
                          key={spell.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isPrepared || isAlwaysPrepared || isCantrip
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            checked={isPrepared || isAlwaysPrepared || isCantrip}
                            disabled={isAlwaysPrepared || isCantrip}
                            onCheckedChange={() => toggleSpellPrepared(spell.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{spell.srd_spells.name}</h4>
                              {spell.is_ritual && (
                                <Badge variant="outline" className="text-xs">
                                  Ritual
                                </Badge>
                              )}
                              {isAlwaysPrepared && (
                                <Badge variant="secondary" className="text-xs">
                                  Always Prepared
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {spell.srd_spells.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Check className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Prepared Spells"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

