import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RotateCcw, Check, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MysticArcanumSelection {
  level: number;
  spellId: string | null;
  spellName: string | null;
  used: boolean;
}

interface MysticArcanumTrackerProps {
  characterId: string;
  characterName: string;
  warlockLevel: number;
  arcanum6Used: boolean;
  arcanum7Used: boolean;
  arcanum8Used: boolean;
  arcanum9Used: boolean;
  onUpdate?: (updates: Partial<{
    mystic_arcanum_6_used: boolean;
    mystic_arcanum_7_used: boolean;
    mystic_arcanum_8_used: boolean;
    mystic_arcanum_9_used: boolean;
  }>) => void;
}

// Warlock levels when they gain each Mystic Arcanum
const ARCANUM_LEVELS: Record<number, number> = {
  6: 11, // 6th-level arcanum at Warlock 11
  7: 13, // 7th-level arcanum at Warlock 13
  8: 15, // 8th-level arcanum at Warlock 15
  9: 17, // 9th-level arcanum at Warlock 17
};

export const MysticArcanumTracker: React.FC<MysticArcanumTrackerProps> = ({
  characterId,
  characterName,
  warlockLevel,
  arcanum6Used,
  arcanum7Used,
  arcanum8Used,
  arcanum9Used,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [arcanumSelections, setArcanumSelections] = useState<MysticArcanumSelection[]>([]);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [selectingLevel, setSelectingLevel] = useState<number | null>(null);
  const [availableSpells, setAvailableSpells] = useState<any[]>([]);

  // Determine which arcanum levels are available based on warlock level
  const availableArcanumLevels = Object.entries(ARCANUM_LEVELS)
    .filter(([_, reqLevel]) => warlockLevel >= reqLevel)
    .map(([spellLevel]) => parseInt(spellLevel));

  // Fetch arcanum selections
  useEffect(() => {
    const fetchSelections = async () => {
      const { data, error } = await supabase
        .from('character_mystic_arcanum')
        .select(`
          spell_level,
          spell_id,
          srd_spells(name)
        `)
        .eq('character_id', characterId);

      if (error) {
        console.error('Error fetching mystic arcanum:', error);
        return;
      }

      const selections: MysticArcanumSelection[] = availableArcanumLevels.map(level => {
        const existing = data?.find((d: any) => d.spell_level === level);
        const used = level === 6 ? arcanum6Used : level === 7 ? arcanum7Used : level === 8 ? arcanum8Used : arcanum9Used;
        return {
          level,
          spellId: existing?.spell_id || null,
          spellName: existing?.srd_spells?.name || null,
          used,
        };
      });

      setArcanumSelections(selections);
    };

    fetchSelections();
  }, [characterId, warlockLevel, arcanum6Used, arcanum7Used, arcanum8Used, arcanum9Used, availableArcanumLevels]);

  const loadSpellsForLevel = useCallback(async (level: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('srd_spells')
      .select('id, name, school, description')
      .eq('level', level)
      .contains('classes', ['Warlock']);

    setLoading(false);

    if (error) {
      toast.error('Failed to load spells');
      return;
    }

    setAvailableSpells(data || []);
  }, []);

  const openSelectDialog = useCallback((level: number) => {
    setSelectingLevel(level);
    loadSpellsForLevel(level);
    setSelectDialogOpen(true);
  }, [loadSpellsForLevel]);

  const selectSpell = useCallback(async (spellId: string, spellName: string) => {
    if (!selectingLevel) return;

    const { error } = await supabase
      .from('character_mystic_arcanum')
      .upsert({
        character_id: characterId,
        spell_level: selectingLevel,
        spell_id: spellId,
      }, { onConflict: 'character_id,spell_level' });

    if (error) {
      toast.error('Failed to select arcanum spell');
      console.error(error);
      return;
    }

    setArcanumSelections(prev => prev.map(s => 
      s.level === selectingLevel 
        ? { ...s, spellId, spellName }
        : s
    ));

    toast.success(`Selected ${spellName} as ${selectingLevel}th-level Mystic Arcanum`);
    setSelectDialogOpen(false);
  }, [characterId, selectingLevel]);

  const useArcanum = useCallback(async (level: number) => {
    const fieldMap: Record<number, string> = {
      6: 'mystic_arcanum_6_used',
      7: 'mystic_arcanum_7_used',
      8: 'mystic_arcanum_8_used',
      9: 'mystic_arcanum_9_used',
    };

    const field = fieldMap[level];
    const { error } = await supabase
      .from('characters')
      .update({ [field]: true })
      .eq('id', characterId);

    if (error) {
      toast.error('Failed to use mystic arcanum');
      return;
    }

    const spell = arcanumSelections.find(s => s.level === level);
    toast.info(`${characterName} cast ${spell?.spellName || `${level}th-level Arcanum`}`);
    onUpdate?.({ [field]: true } as any);
  }, [characterId, characterName, arcanumSelections, onUpdate]);

  const resetAllArcanum = useCallback(async () => {
    const { error } = await supabase
      .from('characters')
      .update({
        mystic_arcanum_6_used: false,
        mystic_arcanum_7_used: false,
        mystic_arcanum_8_used: false,
        mystic_arcanum_9_used: false,
      })
      .eq('id', characterId);

    if (error) {
      toast.error('Failed to reset mystic arcanum');
      return;
    }

    toast.success('Mystic Arcanum reset on long rest');
    onUpdate?.({
      mystic_arcanum_6_used: false,
      mystic_arcanum_7_used: false,
      mystic_arcanum_8_used: false,
      mystic_arcanum_9_used: false,
    });
  }, [characterId, onUpdate]);

  if (availableArcanumLevels.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-indigo-500/30 bg-indigo-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Mystic Arcanum
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={resetAllArcanum}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {arcanumSelections.map((arcanum) => (
            <div
              key={arcanum.level}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                arcanum.used
                  ? 'bg-muted border-muted-foreground/30 opacity-60'
                  : 'border-indigo-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {arcanum.level}th
                </Badge>
                {arcanum.spellName ? (
                  <span className="text-sm font-medium">{arcanum.spellName}</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => openSelectDialog(arcanum.level)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Select Spell
                  </Button>
                )}
              </div>
              {arcanum.spellName && (
                <Button
                  variant={arcanum.used ? 'ghost' : 'outline'}
                  size="sm"
                  className="h-7"
                  disabled={arcanum.used}
                  onClick={() => useArcanum(arcanum.level)}
                >
                  {arcanum.used ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Used
                    </>
                  ) : (
                    'Cast'
                  )}
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Each Mystic Arcanum can be cast once per long rest
          </p>
        </CardContent>
      </Card>

      {/* Spell Selection Dialog */}
      <Dialog open={selectDialogOpen} onOpenChange={setSelectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select {selectingLevel}th-Level Mystic Arcanum</DialogTitle>
            <DialogDescription>
              Choose a Warlock spell of {selectingLevel}th level. This choice is permanent.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading spells...
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {availableSpells.map((spell) => (
                  <div
                    key={spell.id}
                    className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                    onClick={() => selectSpell(spell.id, spell.name)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{spell.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {spell.school}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {spell.description}
                    </p>
                  </div>
                ))}
                {availableSpells.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No Warlock spells found for this level
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
