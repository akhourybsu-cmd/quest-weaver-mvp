import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Sword, Sparkles, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';
type CoverType = 'none' | 'half' | 'three_quarters' | 'full';

interface AttackRollDialogProps {
  encounterId: string;
  attackerId: string;
  attackerName: string;
  attackerType: 'character' | 'monster';
  attackBonus: number;
  onHit: (damage: number, isCritical: boolean) => void;
  children: React.ReactNode;
}

const AttackRollDialog = ({
  encounterId,
  attackerId,
  attackerName,
  attackerType,
  attackBonus,
  onHit,
  children,
}: AttackRollDialogProps) => {
  const [open, setOpen] = useState(false);
  const [targetAC, setTargetAC] = useState("");
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [cover, setCover] = useState<CoverType>('none');
  const [roll1, setRoll1] = useState<number | null>(null);
  const [roll2, setRoll2] = useState<number | null>(null);
  const [finalRoll, setFinalRoll] = useState<number | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [isHit, setIsHit] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check for active modifiers on actor
  useEffect(() => {
    if (open) {
      loadModifiers();
    }
  }, [open, attackerId]);

  const loadModifiers = async () => {
    const { data } = await supabase
      .from('combat_modifiers')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('actor_id', attackerId)
      .eq('actor_type', attackerType);

    if (data && data.length > 0) {
      const hasAdvantage = data.some(m => m.modifier_type === 'advantage');
      const hasDisadvantage = data.some(m => m.modifier_type === 'disadvantage');
      
      // RAW: Advantage and disadvantage cancel out
      if (hasAdvantage && hasDisadvantage) {
        setAdvantageMode('normal');
      } else if (hasAdvantage) {
        setAdvantageMode('advantage');
      } else if (hasDisadvantage) {
        setAdvantageMode('disadvantage');
      }

      // Check for cover modifiers
      const coverMod = data.find(m => m.modifier_type.startsWith('cover_'));
      if (coverMod) {
        if (coverMod.modifier_type === 'cover_half') setCover('half');
        else if (coverMod.modifier_type === 'cover_three_quarters') setCover('three_quarters');
        else if (coverMod.modifier_type === 'cover_full') setCover('full');
      }
    }
  };

  const rollAttack = () => {
    const r1 = Math.floor(Math.random() * 20) + 1;
    setRoll1(r1);

    if (advantageMode === 'normal') {
      setRoll2(null);
      calculateResult(r1, null);
    } else {
      const r2 = Math.floor(Math.random() * 20) + 1;
      setRoll2(r2);
      calculateResult(r1, r2);
    }
  };

  const calculateResult = (r1: number, r2: number | null) => {
    let chosenRoll = r1;

    if (r2 !== null) {
      if (advantageMode === 'advantage') {
        chosenRoll = Math.max(r1, r2);
      } else if (advantageMode === 'disadvantage') {
        chosenRoll = Math.min(r1, r2);
      }
    }

    // Check for critical hit (natural 20)
    const critical = chosenRoll === 20;
    setIsCritical(critical);

    // Calculate cover bonus
    let coverBonus = 0;
    if (cover === 'half') coverBonus = 2;
    else if (cover === 'three_quarters') coverBonus = 5;
    else if (cover === 'full') {
      // Can't target directly
      setIsHit(false);
      setFinalRoll(null);
      toast({
        title: "Full Cover",
        description: "Target has full cover and cannot be targeted directly",
        variant: "destructive",
      });
      return;
    }

    const total = chosenRoll + attackBonus;
    const targetWithCover = parseInt(targetAC || "0") + coverBonus;

    setFinalRoll(total);

    // Natural 20 always hits (except vs full cover)
    // Natural 1 always misses
    if (chosenRoll === 20) {
      setIsHit(true);
    } else if (chosenRoll === 1) {
      setIsHit(false);
    } else {
      setIsHit(total >= targetWithCover);
    }
  };

  const handleConfirm = () => {
    if (isHit && finalRoll !== null) {
      // Pass to damage roll with critical flag
      onHit(finalRoll, isCritical);
      resetState();
      setOpen(false);
    }
  };

  const resetState = () => {
    setRoll1(null);
    setRoll2(null);
    setFinalRoll(null);
    setIsCritical(false);
    setIsHit(null);
    setTargetAC("");
    setCover('none');
  };

  const getCoverACBonus = () => {
    if (cover === 'half') return '+2 AC';
    if (cover === 'three_quarters') return '+5 AC';
    if (cover === 'full') return 'Cannot target';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Attack Roll - {attackerName}
          </DialogTitle>
          <DialogDescription>
            Roll to hit with attack bonus +{attackBonus}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target AC */}
          <div className="space-y-2">
            <Label htmlFor="target-ac">Target AC</Label>
            <Input
              id="target-ac"
              type="number"
              value={targetAC}
              onChange={(e) => setTargetAC(e.target.value)}
              placeholder="Enter target's AC"
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
                <SelectItem value="advantage">Advantage (roll 2, keep high)</SelectItem>
                <SelectItem value="disadvantage">Disadvantage (roll 2, keep low)</SelectItem>
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
                <SelectItem value="three_quarters">Three-Quarters Cover (+5 AC)</SelectItem>
                <SelectItem value="full">Full Cover (Cannot target)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roll Button */}
          <Button 
            onClick={rollAttack} 
            className="w-full"
            disabled={!targetAC || cover === 'full'}
          >
            Roll Attack
          </Button>

          {/* Results */}
          {(roll1 !== null || roll2 !== null) && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Roll Results:</span>
                {advantageMode !== 'normal' && (
                  <Badge variant="outline">
                    {advantageMode === 'advantage' ? 'Keep Highest' : 'Keep Lowest'}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {roll1 !== null && (
                  <Badge 
                    variant={roll1 === 20 ? "default" : roll1 === 1 ? "destructive" : "secondary"}
                    className="text-lg px-4 py-2"
                  >
                    {roll1}
                    {roll1 === 20 && <Sparkles className="w-3 h-3 ml-1 inline" />}
                    {roll1 === 1 && <Skull className="w-3 h-3 ml-1 inline" />}
                  </Badge>
                )}
                {roll2 !== null && (
                  <Badge 
                    variant={roll2 === 20 ? "default" : roll2 === 1 ? "destructive" : "secondary"}
                    className="text-lg px-4 py-2"
                  >
                    {roll2}
                    {roll2 === 20 && <Sparkles className="w-3 h-3 ml-1 inline" />}
                    {roll2 === 1 && <Skull className="w-3 h-3 ml-1 inline" />}
                  </Badge>
                )}
              </div>

              {finalRoll !== null && (
                <>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chosen Roll:</span>
                      <span className="font-medium">
                        {advantageMode === 'normal' ? roll1 : advantageMode === 'advantage' ? Math.max(roll1!, roll2!) : Math.min(roll1!, roll2!)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attack Bonus:</span>
                      <span className="font-medium">+{attackBonus}</span>
                    </div>
                    {cover !== 'none' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Cover:</span>
                        <span className="font-medium">{getCoverACBonus()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="font-semibold">Total:</span>
                    <Badge variant="outline" className="text-xl px-3 py-1">
                      {finalRoll}
                    </Badge>
                  </div>

                  {isHit !== null && (
                    <div className={`p-3 rounded-lg text-center font-bold ${isHit ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                      {isCritical && isHit && (
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Sparkles className="w-5 h-5" />
                          <span className="text-lg">CRITICAL HIT!</span>
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}
                      <div className="text-lg">
                        {isHit ? 'HIT' : 'MISS'} (vs AC {parseInt(targetAC) + (cover === 'half' ? 2 : cover === 'three_quarters' ? 5 : 0)})
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Confirm */}
          {isHit && (
            <Button onClick={handleConfirm} className="w-full" variant="default">
              Roll Damage {isCritical && '(Critical!)'}
            </Button>
          )}

          {isHit === false && (
            <Button onClick={() => { resetState(); }} className="w-full" variant="outline">
              Roll Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttackRollDialog;
