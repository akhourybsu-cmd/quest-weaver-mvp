import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Moon, RotateCcw, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WarlockPactSlotsProps {
  characterId: string;
  characterName: string;
  pactSlotsMax: number;
  pactSlotsUsed: number;
  pactSlotLevel: number;
  onUpdate?: (updates: { pactSlotsUsed: number }) => void;
  compact?: boolean;
}

// Warlock pact slots by level (PHB)
const WARLOCK_PACT_SLOTS: Record<number, { slots: number; level: number }> = {
  1: { slots: 1, level: 1 },
  2: { slots: 2, level: 1 },
  3: { slots: 2, level: 2 },
  4: { slots: 2, level: 2 },
  5: { slots: 2, level: 3 },
  6: { slots: 2, level: 3 },
  7: { slots: 2, level: 4 },
  8: { slots: 2, level: 4 },
  9: { slots: 2, level: 5 },
  10: { slots: 2, level: 5 },
  11: { slots: 3, level: 5 },
  12: { slots: 3, level: 5 },
  13: { slots: 3, level: 5 },
  14: { slots: 3, level: 5 },
  15: { slots: 3, level: 5 },
  16: { slots: 3, level: 5 },
  17: { slots: 4, level: 5 },
  18: { slots: 4, level: 5 },
  19: { slots: 4, level: 5 },
  20: { slots: 4, level: 5 },
};

export function getWarlockPactSlots(warlockLevel: number) {
  return WARLOCK_PACT_SLOTS[Math.min(20, Math.max(1, warlockLevel))] || { slots: 1, level: 1 };
}

export const WarlockPactSlots: React.FC<WarlockPactSlotsProps> = ({
  characterId,
  characterName,
  pactSlotsMax,
  pactSlotsUsed,
  pactSlotLevel,
  onUpdate,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const remaining = pactSlotsMax - pactSlotsUsed;

  const updatePactSlots = useCallback(async (newUsed: number) => {
    const clamped = Math.max(0, Math.min(pactSlotsMax, newUsed));
    setLoading(true);

    const { error } = await supabase
      .from('characters')
      .update({ pact_slots_used: clamped })
      .eq('id', characterId);

    setLoading(false);

    if (error) {
      toast.error('Failed to update pact slots');
      console.error(error);
      return;
    }

    onUpdate?.({ pactSlotsUsed: clamped });
  }, [characterId, pactSlotsMax, onUpdate]);

  const useSlot = useCallback(() => {
    if (remaining <= 0) {
      toast.error('No pact slots remaining');
      return;
    }
    updatePactSlots(pactSlotsUsed + 1);
    toast.info(`${characterName} used a pact slot (${remaining - 1} remaining)`);
  }, [remaining, pactSlotsUsed, characterName, updatePactSlots]);

  const recoverSlots = useCallback(() => {
    updatePactSlots(0);
    toast.success(`${characterName} recovered all pact slots on short rest`);
  }, [characterName, updatePactSlots]);

  if (pactSlotsMax === 0) return null;

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-2 gap-1 ${remaining === 0 ? 'text-muted-foreground' : ''}`}
          >
            <Moon className="h-3 w-3" />
            <span className="text-xs font-mono">{remaining}/{pactSlotsMax}</span>
            <Badge variant="outline" className="h-4 px-1 text-xs">
              Lv{pactSlotLevel}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <PactSlotsContent
            remaining={remaining}
            pactSlotsMax={pactSlotsMax}
            pactSlotLevel={pactSlotLevel}
            loading={loading}
            onUseSlot={useSlot}
            onRecoverSlots={recoverSlots}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Moon className="h-4 w-4 text-purple-500" />
          Pact Magic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PactSlotsContent
          remaining={remaining}
          pactSlotsMax={pactSlotsMax}
          pactSlotLevel={pactSlotLevel}
          loading={loading}
          onUseSlot={useSlot}
          onRecoverSlots={recoverSlots}
        />
      </CardContent>
    </Card>
  );
};

interface PactSlotsContentProps {
  remaining: number;
  pactSlotsMax: number;
  pactSlotLevel: number;
  loading: boolean;
  onUseSlot: () => void;
  onRecoverSlots: () => void;
}

const PactSlotsContent: React.FC<PactSlotsContentProps> = ({
  remaining,
  pactSlotsMax,
  pactSlotLevel,
  loading,
  onUseSlot,
  onRecoverSlots,
}) => {
  return (
    <div className="space-y-3">
      {/* Slot Level */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Pact Slot Level</span>
        <Badge variant="secondary" className="text-lg font-bold">
          {pactSlotLevel}
        </Badge>
      </div>

      {/* Slot Pips */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: pactSlotsMax }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
              i < remaining
                ? 'bg-purple-500 border-purple-600 text-purple-950'
                : 'bg-muted border-muted-foreground/30'
            }`}
          >
            {i < remaining && <Moon className="h-5 w-5" />}
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center text-sm text-muted-foreground">
        {remaining} of {pactSlotsMax} slots remaining
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUseSlot}
          disabled={loading || remaining <= 0}
          className="flex-1"
        >
          <Minus className="h-3 w-3 mr-1" />
          Use Slot
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRecoverSlots}
          disabled={loading || remaining === pactSlotsMax}
          className="flex-1"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Short Rest
        </Button>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        All pact slots recover on short or long rest
      </p>
    </div>
  );
};
