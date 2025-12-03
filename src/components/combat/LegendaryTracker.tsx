import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Crown, Shield, Sparkles, RotateCcw, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LegendaryTrackerProps {
  monsterId: string;
  monsterName: string;
  legendaryActionsMax: number;
  legendaryActionsRemaining: number;
  legendaryResistancesMax: number;
  legendaryResistancesRemaining: number;
  onUpdate?: (updates: {
    legendaryActionsRemaining?: number;
    legendaryResistancesRemaining?: number;
  }) => void;
  compact?: boolean;
}

export const LegendaryTracker: React.FC<LegendaryTrackerProps> = ({
  monsterId,
  monsterName,
  legendaryActionsMax,
  legendaryActionsRemaining,
  legendaryResistancesMax,
  legendaryResistancesRemaining,
  onUpdate,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);

  const hasLegendaryActions = legendaryActionsMax > 0;
  const hasLegendaryResistances = legendaryResistancesMax > 0;

  if (!hasLegendaryActions && !hasLegendaryResistances) {
    return null;
  }

  const updateLegendary = useCallback(async (field: 'legendary_actions_remaining' | 'legendary_resistances_remaining', value: number) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('encounter_monsters')
      .update({ [field]: value })
      .eq('id', monsterId);
    
    setLoading(false);
    
    if (error) {
      toast.error('Failed to update legendary resource');
      console.error(error);
      return;
    }
    
    if (field === 'legendary_actions_remaining') {
      onUpdate?.({ legendaryActionsRemaining: value });
    } else {
      onUpdate?.({ legendaryResistancesRemaining: value });
    }
  }, [monsterId, onUpdate]);

  const useLegendaryAction = useCallback((cost: number = 1) => {
    const newValue = Math.max(0, legendaryActionsRemaining - cost);
    updateLegendary('legendary_actions_remaining', newValue);
    toast.info(`${monsterName} used ${cost} legendary action(s)`);
  }, [legendaryActionsRemaining, monsterName, updateLegendary]);

  const useLegendaryResistance = useCallback(() => {
    if (legendaryResistancesRemaining <= 0) {
      toast.error('No legendary resistances remaining');
      return;
    }
    const newValue = legendaryResistancesRemaining - 1;
    updateLegendary('legendary_resistances_remaining', newValue);
    toast.warning(`${monsterName} used legendary resistance! (${newValue} remaining)`);
  }, [legendaryResistancesRemaining, monsterName, updateLegendary]);

  const resetLegendaryActions = useCallback(() => {
    updateLegendary('legendary_actions_remaining', legendaryActionsMax);
    toast.success(`${monsterName}'s legendary actions reset to ${legendaryActionsMax}`);
  }, [legendaryActionsMax, monsterName, updateLegendary]);

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
            {hasLegendaryActions && (
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                <Sparkles className="h-3 w-3 mr-0.5" />
                {legendaryActionsRemaining}/{legendaryActionsMax}
              </Badge>
            )}
            {hasLegendaryResistances && (
              <Badge variant="outline" className="h-5 px-1 text-xs bg-purple-500/20">
                <Shield className="h-3 w-3 mr-0.5" />
                {legendaryResistancesRemaining}/{legendaryResistancesMax}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <LegendaryContent
            monsterName={monsterName}
            hasLegendaryActions={hasLegendaryActions}
            hasLegendaryResistances={hasLegendaryResistances}
            legendaryActionsMax={legendaryActionsMax}
            legendaryActionsRemaining={legendaryActionsRemaining}
            legendaryResistancesMax={legendaryResistancesMax}
            legendaryResistancesRemaining={legendaryResistancesRemaining}
            loading={loading}
            onUseAction={useLegendaryAction}
            onUseResistance={useLegendaryResistance}
            onResetActions={resetLegendaryActions}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          Legendary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LegendaryContent
          monsterName={monsterName}
          hasLegendaryActions={hasLegendaryActions}
          hasLegendaryResistances={hasLegendaryResistances}
          legendaryActionsMax={legendaryActionsMax}
          legendaryActionsRemaining={legendaryActionsRemaining}
          legendaryResistancesMax={legendaryResistancesMax}
          legendaryResistancesRemaining={legendaryResistancesRemaining}
          loading={loading}
          onUseAction={useLegendaryAction}
          onUseResistance={useLegendaryResistance}
          onResetActions={resetLegendaryActions}
        />
      </CardContent>
    </Card>
  );
};

interface LegendaryContentProps {
  monsterName: string;
  hasLegendaryActions: boolean;
  hasLegendaryResistances: boolean;
  legendaryActionsMax: number;
  legendaryActionsRemaining: number;
  legendaryResistancesMax: number;
  legendaryResistancesRemaining: number;
  loading: boolean;
  onUseAction: (cost?: number) => void;
  onUseResistance: () => void;
  onResetActions: () => void;
}

const LegendaryContent: React.FC<LegendaryContentProps> = ({
  monsterName,
  hasLegendaryActions,
  hasLegendaryResistances,
  legendaryActionsMax,
  legendaryActionsRemaining,
  legendaryResistancesMax,
  legendaryResistancesRemaining,
  loading,
  onUseAction,
  onUseResistance,
  onResetActions,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm">{monsterName}</h4>

      {/* Legendary Actions */}
      {hasLegendaryActions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Legendary Actions
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={onResetActions}
              disabled={loading || legendaryActionsRemaining === legendaryActionsMax}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Action Pips */}
          <div className="flex gap-1">
            {Array.from({ length: legendaryActionsMax }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                  i < legendaryActionsRemaining
                    ? 'bg-yellow-500 border-yellow-600 text-yellow-950'
                    : 'bg-muted border-muted-foreground/30'
                }`}
              >
                {i < legendaryActionsRemaining && <Sparkles className="h-4 w-4" />}
              </div>
            ))}
          </div>
          
          {/* Use Actions */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUseAction(1)}
              disabled={loading || legendaryActionsRemaining < 1}
              className="flex-1"
            >
              <Minus className="h-3 w-3 mr-1" />
              Use 1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUseAction(2)}
              disabled={loading || legendaryActionsRemaining < 2}
              className="flex-1"
            >
              <Minus className="h-3 w-3 mr-1" />
              Use 2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUseAction(3)}
              disabled={loading || legendaryActionsRemaining < 3}
              className="flex-1"
            >
              <Minus className="h-3 w-3 mr-1" />
              Use 3
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Resets at the start of {monsterName}'s turn
          </p>
        </div>
      )}

      {/* Legendary Resistances */}
      {hasLegendaryResistances && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-4 w-4 text-purple-500" />
              Legendary Resistances
            </span>
            <span className="text-sm">
              {legendaryResistancesRemaining}/{legendaryResistancesMax}
            </span>
          </div>
          
          {/* Resistance Pips */}
          <div className="flex gap-1">
            {Array.from({ length: legendaryResistancesMax }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                  i < legendaryResistancesRemaining
                    ? 'bg-purple-500 border-purple-600 text-purple-950'
                    : 'bg-muted border-muted-foreground/30'
                }`}
              >
                {i < legendaryResistancesRemaining && <Shield className="h-4 w-4" />}
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onUseResistance}
            disabled={loading || legendaryResistancesRemaining <= 0}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            Use Legendary Resistance
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Auto-succeed a failed saving throw (uses per day)
          </p>
        </div>
      )}
    </div>
  );
};
