import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAvailableSlotLevels, scaleSpellEffect, type SpellScaling } from "@/lib/spellScaling";
import { validateSpellCast, type ValidationResult, type SpellComponents } from "@/lib/spellCastValidator";

interface SpellSlot {
  id: string;
  spell_level: number;
  max_slots: number;
  used_slots: number;
  bonus_slots?: number;
}

interface SpellCastDialogProps {
  characterId: string;
  encounterId?: string;
  spell: {
    id: string;
    name: string;
    level: number;
    school: string;
    description: string;
    damage?: string;
    healing?: string;
    scaling_type?: string;
    scaling_value?: string;
    scaling_description?: string;
    casting_time?: string;
    concentration?: boolean;
    components?: any;
  };
  onCast: (slotLevel: number, scalingInfo?: string) => void;
  children: React.ReactNode;
}

const SpellCastDialog = ({
  characterId,
  encounterId,
  spell,
  onCast,
  children,
}: SpellCastDialogProps) => {
  const [open, setOpen] = useState(false);
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);
  const [selectedSlotLevel, setSelectedSlotLevel] = useState<number>(spell.level);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSpellSlots();
      validateCasting();
    }
  }, [open, characterId, selectedSlotLevel]);

  useEffect(() => {
    // Subscribe to realtime slot updates
    const channel = supabase
      .channel('spell-slots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_spell_slots',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          loadSpellSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadSpellSlots = async () => {
    const { data } = await supabase
      .from('character_spell_slots')
      .select('*')
      .eq('character_id', characterId)
      .order('spell_level');

    if (data) {
      setSpellSlots(data);
      
      // Auto-select lowest available slot level >= spell base level
      const availableSlot = data.find(
        slot => slot.spell_level >= spell.level && slot.used_slots < (slot.max_slots + (slot.bonus_slots || 0))
      );
      if (availableSlot) {
        setSelectedSlotLevel(availableSlot.spell_level);
      }
    }
  };

  const validateCasting = async () => {
    if (spell.level === 0) {
      setValidation({ canCast: true, blockers: [], warnings: [], willBreakConcentration: false });
      return;
    }

    // Get character data for validation
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (!character) return;

    // Get turn state if in combat
    let turnState = { hasLeveledSpellThisTurn: false, leveledSpellWasBonusAction: false };
    if (encounterId) {
      const { data: initiative } = await supabase
        .from('initiative')
        .select('*')
        .eq('encounter_id', encounterId)
        .eq('combatant_id', characterId)
        .single();
      
      if (initiative) {
        turnState = {
          hasLeveledSpellThisTurn: initiative.has_leveled_spell_this_turn || false,
          leveledSpellWasBonusAction: initiative.leveled_spell_was_bonus_action || false,
        };
      }
    }

    // TODO: Implement inventory checking when we have proper item tracking
    const hasFocus = true; // Assume has focus for now
    const hasComponentPouch = true; // Assume has component pouch for now

    // Get concentration status
    const { data: effects } = await supabase
      .from('effects')
      .select('*')
      .eq('concentrating_character_id', characterId)
      .eq('requires_concentration', true);

    const concentrating = (effects?.length || 0) > 0;
    const concentrationSpell = effects?.[0]?.name;

    // Get gold from resources
    const resources = character.resources as any;
    const goldGp = typeof resources === 'object' && resources !== null ? (resources.gold_gp || 0) : 0;

    const context = {
      actionUsed: character.action_used || false,
      bonusActionUsed: character.bonus_action_used || false,
      reactionUsed: character.reaction_used || false,
      concentrating,
      concentrationSpell,
      hasLeveledSpellThisTurn: turnState.hasLeveledSpellThisTurn,
      leveledSpellWasBonusAction: turnState.leveledSpellWasBonusAction,
      hasFocus,
      hasComponentPouch,
      hasFreeSomaticHand: true, // TODO: Track hand state
      inventory: [], // TODO: Implement inventory checking
      goldGp,
    };

    const components: SpellComponents = spell.components || { verbal: false, somatic: false, material: false };
    
    const result = validateSpellCast(
      {
        level: selectedSlotLevel,
        casting_time: spell.casting_time || '1 action',
        components,
        concentration: spell.concentration || false,
      },
      context
    );

    setValidation(result);
  };

  const getAvailableSlots = (level: number): number => {
    const slot = spellSlots.find(s => s.spell_level === level);
    if (!slot) return 0;
    const total = slot.max_slots + (slot.bonus_slots || 0);
    return total - slot.used_slots;
  };

  const hasAvailableSlot = (level: number): boolean => {
    return getAvailableSlots(level) > 0;
  };

  const handleCast = async () => {
    if (validation && !validation.canCast) {
      toast({
        title: "Cannot cast spell",
        description: validation.blockers[0],
        variant: "destructive",
      });
      return;
    }

    if (!hasAvailableSlot(selectedSlotLevel)) {
      toast({
        title: "No spell slots available",
        description: `You don't have any level ${selectedSlotLevel} spell slots remaining`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the slot to use
      const slot = spellSlots.find(s => s.spell_level === selectedSlotLevel);
      if (!slot) throw new Error("Slot not found");

      // Use the spell slot
      const { error: slotError } = await supabase
        .from('character_spell_slots')
        .update({ used_slots: slot.used_slots + 1 })
        .eq('id', slot.id);

      if (slotError) throw slotError;

      // Update turn state if in combat
      if (encounterId) {
        const isBonusAction = spell.casting_time?.toLowerCase().includes('bonus action');
        await supabase
          .from('initiative')
          .update({
            has_leveled_spell_this_turn: true,
            leveled_spell_was_bonus_action: isBonusAction,
          })
          .eq('encounter_id', encounterId)
          .eq('combatant_id', characterId);
      }

      // Deduct consumed material costs
      if (spell.components?.material && spell.components?.consumed && spell.components?.material_cost) {
        const cost = spell.components.material_cost;
        const { data: character } = await supabase
          .from('characters')
          .select('resources')
          .eq('id', characterId)
          .single();

        if (character && character.resources) {
          const resources = character.resources as any;
          const currentGold = typeof resources === 'object' && resources !== null ? (resources.gold_gp || 0) : 0;
          
          await supabase
            .from('characters')
            .update({
              resources: {
                ...(typeof resources === 'object' ? resources : {}),
                gold_gp: currentGold - cost,
              },
            })
            .eq('id', characterId);
        }
      }

      // Log the spell cast
      await supabase.from('spell_casting_history').insert({
        character_id: characterId,
        spell_id: spell.id,
        spell_level_cast: selectedSlotLevel,
      });

      // Calculate scaling info if applicable
      let scalingInfo = '';
      if (spell.scaling_type && spell.scaling_value && selectedSlotLevel > spell.level) {
        const scaling: SpellScaling = {
          type: spell.scaling_type as any,
          value: spell.scaling_value,
          description: spell.scaling_description,
        };
        
        const baseValue = spell.damage || spell.healing || '';
        if (baseValue) {
          const scaled = scaleSpellEffect(spell.level, selectedSlotLevel, scaling, baseValue);
          scalingInfo = scaled.description;
        }
      }

      toast({
        title: "Spell cast!",
        description: `${spell.name}${selectedSlotLevel > spell.level ? ` (upcast to level ${selectedSlotLevel})` : ''}`,
      });

      onCast(selectedSlotLevel, scalingInfo);
      setOpen(false);
    } catch (error) {
      console.error('Error casting spell:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cast spell",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canUpcast = spell.level < 9 && spellSlots.some(
    s => s.spell_level > spell.level && getAvailableSlots(s.spell_level) > 0
  );

  const getScalingPreview = (): string | null => {
    if (!spell.scaling_type || !spell.scaling_value || selectedSlotLevel <= spell.level) {
      return null;
    }

    const scaling: SpellScaling = {
      type: spell.scaling_type as any,
      value: spell.scaling_value,
      description: spell.scaling_description,
    };

    const baseValue = spell.damage || spell.healing || '';
    if (!baseValue) return spell.scaling_description || null;

    const scaled = scaleSpellEffect(spell.level, selectedSlotLevel, scaling, baseValue);
    return `${scaled.originalValue} → ${scaled.scaledValue} (${scaled.description})`;
  };

  // Cantrips don't use slots
  if (spell.level === 0) {
    return (
      <div onClick={() => onCast(0)}>
        {children}
      </div>
    );
  }

  const availableLevels = getAvailableSlotLevels(spell.level, 9).filter(hasAvailableSlot);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Cast {spell.name}
          </DialogTitle>
          <DialogDescription>
            Level {spell.level} {spell.school} spell
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Spell Description */}
          <div className="text-sm text-muted-foreground">
            {spell.description}
          </div>

          {/* Validation Results */}
          {validation && validation.blockers.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validation.blockers.map((blocker, i) => (
                  <div key={i}>{blocker}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {validation && validation.warnings.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {validation.warnings.map((warning, i) => (
                  <div key={i}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Slot Level Selection */}
          <div className="space-y-2">
            <Label>Cast Using Spell Slot Level</Label>
            <Select
              value={selectedSlotLevel.toString()}
              onValueChange={(v) => setSelectedSlotLevel(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.map(level => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level} ({getAvailableSlots(level)} remaining)
                    {level > spell.level && <Badge variant="secondary" className="ml-2">Upcast</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scaling Preview */}
          {canUpcast && selectedSlotLevel > spell.level && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">Upcasting Effect:</div>
                <div className="text-sm">
                  {getScalingPreview() || spell.scaling_description || 'Enhanced when cast at higher levels'}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* No Slots Warning */}
          {availableLevels.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any available spell slots of level {spell.level} or higher.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Slots Display */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Available Spell Slots</Label>
            <div className="flex gap-2 flex-wrap">
              {spellSlots
                .filter(s => s.spell_level >= spell.level)
                .map(slot => {
                  const available = getAvailableSlots(slot.spell_level);
                  const total = slot.max_slots + (slot.bonus_slots || 0);
                  return (
                    <Badge
                      key={slot.id}
                      variant={available > 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      L{slot.spell_level}: {available}/{total}
                    </Badge>
                  );
                })}
            </div>
          </div>

          {/* Cast Button */}
          <Button
            onClick={handleCast}
            disabled={loading || availableLevels.length === 0 || (validation && !validation.canCast)}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Cast Spell
            {selectedSlotLevel > spell.level && ` (Level ${selectedSlotLevel})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpellCastDialog;
