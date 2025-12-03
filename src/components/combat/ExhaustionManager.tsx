import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, ChevronUp, ChevronDown, Skull, Zap, Footprints, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getExhaustionEffects, 
  getModifiedSpeed, 
  getModifiedMaxHP,
  isDyingFromExhaustion,
  EXHAUSTION_LEVELS,
} from '@/lib/exhaustionRules';

interface ExhaustionManagerProps {
  characterId: string;
  characterName: string;
  currentLevel: number;
  baseSpeed?: number;
  baseMaxHP?: number;
  onLevelChange?: (newLevel: number) => void;
  compact?: boolean;
}

export const ExhaustionManager: React.FC<ExhaustionManagerProps> = ({
  characterId,
  characterName,
  currentLevel,
  baseSpeed = 30,
  baseMaxHP = 10,
  onLevelChange,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const effects = getExhaustionEffects(currentLevel);
  const modifiedSpeed = getModifiedSpeed(baseSpeed, currentLevel);
  const modifiedMaxHP = getModifiedMaxHP(baseMaxHP, currentLevel);
  const isDying = isDyingFromExhaustion(currentLevel);

  const updateExhaustion = useCallback(async (newLevel: number) => {
    const clamped = Math.max(0, Math.min(6, newLevel));
    setLoading(true);
    
    const { error } = await supabase
      .from('characters')
      .update({ exhaustion_level: clamped })
      .eq('id', characterId);
    
    setLoading(false);
    
    if (error) {
      toast.error('Failed to update exhaustion level');
      console.error(error);
      return;
    }
    
    onLevelChange?.(clamped);
    
    if (clamped === 6) {
      toast.error(`${characterName} has died from exhaustion!`, { icon: '💀' });
    } else if (clamped > currentLevel) {
      toast.warning(`${characterName} gained exhaustion level ${clamped}`);
    } else if (clamped < currentLevel) {
      toast.success(`${characterName} reduced exhaustion to level ${clamped}`);
    }
  }, [characterId, characterName, currentLevel, onLevelChange]);

  const getExhaustionColor = (level: number) => {
    if (level === 0) return 'bg-green-500/20 text-green-700 border-green-500';
    if (level <= 2) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
    if (level <= 4) return 'bg-orange-500/20 text-orange-700 border-orange-500';
    return 'bg-destructive/20 text-destructive border-destructive';
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-2 ${currentLevel > 0 ? getExhaustionColor(currentLevel) : ''}`}
          >
            <AlertTriangle className={`h-3 w-3 mr-1 ${currentLevel > 0 ? 'text-current' : 'text-muted-foreground'}`} />
            {currentLevel > 0 ? `E${currentLevel}` : 'E0'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <ExhaustionContent
            currentLevel={currentLevel}
            effects={effects}
            modifiedSpeed={modifiedSpeed}
            modifiedMaxHP={modifiedMaxHP}
            baseSpeed={baseSpeed}
            baseMaxHP={baseMaxHP}
            isDying={isDying}
            loading={loading}
            onIncrease={() => updateExhaustion(currentLevel + 1)}
            onDecrease={() => updateExhaustion(currentLevel - 1)}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className={currentLevel > 0 ? getExhaustionColor(currentLevel) : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Exhaustion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ExhaustionContent
          currentLevel={currentLevel}
          effects={effects}
          modifiedSpeed={modifiedSpeed}
          modifiedMaxHP={modifiedMaxHP}
          baseSpeed={baseSpeed}
          baseMaxHP={baseMaxHP}
          isDying={isDying}
          loading={loading}
          onIncrease={() => updateExhaustion(currentLevel + 1)}
          onDecrease={() => updateExhaustion(currentLevel - 1)}
        />
      </CardContent>
    </Card>
  );
};

interface ExhaustionContentProps {
  currentLevel: number;
  effects: ReturnType<typeof getExhaustionEffects>;
  modifiedSpeed: number;
  modifiedMaxHP: number;
  baseSpeed: number;
  baseMaxHP: number;
  isDying: boolean;
  loading: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

const ExhaustionContent: React.FC<ExhaustionContentProps> = ({
  currentLevel,
  effects,
  modifiedSpeed,
  modifiedMaxHP,
  baseSpeed,
  baseMaxHP,
  isDying,
  loading,
  onIncrease,
  onDecrease,
}) => {
  return (
    <div className="space-y-3">
      {/* Level Display & Controls */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold flex items-center gap-2">
          {isDying ? (
            <Skull className="h-6 w-6 text-destructive" />
          ) : (
            <span>Level {currentLevel}</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onDecrease}
            disabled={currentLevel <= 0 || loading}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onIncrease}
            disabled={currentLevel >= 6 || loading}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Effect */}
      <div className="text-sm">
        <p className="font-medium">{effects.description}</p>
      </div>

      {/* Active Penalties */}
      {currentLevel > 0 && !isDying && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Active Penalties:</p>
          <div className="flex flex-wrap gap-1">
            {effects.penalties.abilityChecks && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Ability Checks: Disadvantage
              </Badge>
            )}
            {effects.penalties.attacksAndSaves && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Attacks/Saves: Disadvantage
              </Badge>
            )}
            {effects.penalties.speedHalved && (
              <Badge variant="outline" className="text-xs">
                <Footprints className="h-3 w-3 mr-1" />
                Speed: {modifiedSpeed} ft (was {baseSpeed})
              </Badge>
            )}
            {effects.penalties.speedZero && (
              <Badge variant="destructive" className="text-xs">
                <Footprints className="h-3 w-3 mr-1" />
                Speed: 0 ft
              </Badge>
            )}
            {effects.penalties.hpMaxHalved && (
              <Badge variant="outline" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Max HP: {modifiedMaxHP} (was {baseMaxHP})
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Exhaustion Levels Reference */}
      <div className="border-t pt-2 mt-2">
        <p className="text-xs font-medium text-muted-foreground mb-1">Exhaustion Levels:</p>
        <div className="space-y-0.5 text-xs">
          {EXHAUSTION_LEVELS.slice(1).map(level => (
            <div 
              key={level.level} 
              className={`flex gap-2 ${level.level === currentLevel ? 'font-bold' : 'text-muted-foreground'}`}
            >
              <span className="w-4">{level.level}.</span>
              <span>{level.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
