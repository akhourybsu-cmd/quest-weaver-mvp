import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sword, Target, Zap } from 'lucide-react';
import { rollAttack, type AttackRollResult, type AdvantageMode, type CoverType } from '@/lib/attackRollEngine';
import { applyExhaustionToRoll } from '@/lib/exhaustionRules';

interface PlayerAttackDialogProps {
  characterName: string;
  attackBonus: number;
  weaponName?: string;
  damageFormula?: string;
  exhaustionLevel?: number;
  onAttackComplete?: (result: AttackRollResult & { damage?: number }) => void;
  trigger?: React.ReactNode;
}

export const PlayerAttackDialog: React.FC<PlayerAttackDialogProps> = ({
  characterName,
  attackBonus,
  weaponName = 'Attack',
  damageFormula = '1d8',
  exhaustionLevel = 0,
  onAttackComplete,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [targetAC, setTargetAC] = useState<number>(15);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [cover, setCover] = useState<CoverType>('none');
  const [result, setResult] = useState<AttackRollResult | null>(null);
  const [damageRoll, setDamageRoll] = useState<number | null>(null);

  const resetState = useCallback(() => {
    setResult(null);
    setDamageRoll(null);
    setAdvantageMode('normal');
    setCover('none');
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  }, [resetState]);

  // Apply exhaustion penalties to advantage mode
  const getEffectiveAdvantageMode = useCallback((): AdvantageMode => {
    if (exhaustionLevel >= 3) {
      // Level 3+ exhaustion gives disadvantage on attacks
      if (advantageMode === 'advantage') return 'normal'; // Cancel out
      return 'disadvantage';
    }
    return advantageMode;
  }, [exhaustionLevel, advantageMode]);

  const handleRollAttack = useCallback(() => {
    const effectiveMode = getEffectiveAdvantageMode();
    const attackResult = rollAttack({
      attackBonus,
      targetAC,
      advantageMode: effectiveMode,
      cover,
      criticalRange: 20,
    });
    setResult(attackResult);
  }, [attackBonus, targetAC, cover, getEffectiveAdvantageMode]);

  const handleRollDamage = useCallback(() => {
    if (!result) return;
    
    // Parse damage formula (e.g., "1d8+3" or "2d6")
    const match = damageFormula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) {
      setDamageRoll(0);
      return;
    }
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    const diceCount = result.isCritical ? numDice * 2 : numDice;
    
    for (let i = 0; i < diceCount; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    total += modifier;
    
    setDamageRoll(total);
    onAttackComplete?.({ ...result, damage: total });
  }, [result, damageFormula, onAttackComplete]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sword className="h-4 w-4 mr-2" />
            Attack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-destructive" />
            {characterName} - {weaponName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exhaustion Warning */}
          {exhaustionLevel >= 3 && (
            <div className="p-2 bg-destructive/20 border border-destructive/50 rounded-md text-sm">
              ⚠️ Exhaustion Level {exhaustionLevel}: Disadvantage on attack rolls
            </div>
          )}

          {/* Attack Bonus Display */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Attack Bonus</span>
            <Badge variant="secondary" className="text-lg font-bold">
              {attackBonus >= 0 ? '+' : ''}{attackBonus}
            </Badge>
          </div>

          {/* Target AC Input */}
          <div className="space-y-2">
            <Label htmlFor="targetAC">Target AC</Label>
            <Input
              id="targetAC"
              type="number"
              value={targetAC}
              onChange={(e) => setTargetAC(parseInt(e.target.value) || 0)}
              min={1}
              max={30}
            />
          </div>

          {/* Advantage/Disadvantage */}
          <div className="space-y-2">
            <Label>Roll Type</Label>
            <Select value={advantageMode} onValueChange={(v) => setAdvantageMode(v as AdvantageMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="advantage">Advantage</SelectItem>
                <SelectItem value="disadvantage">Disadvantage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label>Target Cover</Label>
            <Select value={cover} onValueChange={(v) => setCover(v as CoverType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Cover</SelectItem>
                <SelectItem value="half">Half Cover (+2 AC)</SelectItem>
                <SelectItem value="three_quarters">Three-Quarters (+5 AC)</SelectItem>
                <SelectItem value="full">Full Cover (Cannot Target)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roll Button */}
          {!result && (
            <Button onClick={handleRollAttack} className="w-full" disabled={cover === 'full'}>
              <Target className="h-4 w-4 mr-2" />
              Roll Attack
            </Button>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg text-center ${
                result.isCritical ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                result.isHit ? 'bg-green-500/20 border border-green-500' :
                'bg-destructive/20 border border-destructive'
              }`}>
              <div className="text-sm text-muted-foreground mb-1">
                  Rolls: {result.roll1}{result.roll2 !== null ? `, ${result.roll2}` : ''} → Used: {result.chosenRoll}
                </div>
                <div className="text-3xl font-bold">
                  {result.totalWithBonus}
                </div>
                <div className="text-lg font-semibold mt-1">
                  {result.isCritical ? (
                    <span className="text-yellow-500 flex items-center justify-center gap-1">
                      <Zap className="h-5 w-5" /> CRITICAL HIT!
                    </span>
                  ) : result.isHit ? (
                    <span className="text-green-500">HIT!</span>
                  ) : (
                    <span className="text-destructive">MISS</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.description}
                </div>
              </div>

              {/* Damage Roll */}
              {result.isHit && !damageRoll && (
                <Button onClick={handleRollDamage} className="w-full" variant="destructive">
                  Roll Damage ({damageFormula}{result.isCritical ? ' ×2 dice' : ''})
                </Button>
              )}

              {damageRoll !== null && (
                <div className="p-4 bg-destructive/20 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">Damage</div>
                  <div className="text-3xl font-bold text-destructive">{damageRoll}</div>
                </div>
              )}

              {/* Roll Again */}
              <Button onClick={resetState} variant="outline" className="w-full">
                Roll Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
