import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialInteractionDialogProps {
  npcId: string;
  npcName: string;
  currentAttitude: 'hostile' | 'indifferent' | 'friendly';
  characterName: string;
  characterId: string;
}

const ATTITUDE_COLORS: Record<string, string> = {
  hostile: 'destructive',
  indifferent: 'secondary',
  friendly: 'default',
};

const DC_BANDS: Record<string, { dc: number; description: string }> = {
  trivial: { dc: 5, description: 'Almost certain success' },
  easy: { dc: 10, description: 'Easy task' },
  moderate: { dc: 15, description: 'Moderate challenge' },
  hard: { dc: 20, description: 'Hard task' },
  very_hard: { dc: 25, description: 'Very difficult' },
  nearly_impossible: { dc: 30, description: 'Nearly impossible' },
};

export function SocialInteractionDialog({
  npcId,
  npcName,
  currentAttitude,
  characterName,
  characterId,
}: SocialInteractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [skillType, setSkillType] = useState<'persuasion' | 'deception' | 'intimidation'>('persuasion');
  const [dcBand, setDcBand] = useState('moderate');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; total: number; success: boolean; newAttitude?: string } | null>(null);

  const handleRoll = async () => {
    setRolling(true);

    try {
      // Get character's skill modifier
      const { data: charData } = await supabase
        .from('characters')
        .select('id') // Would need actual skill modifiers here
        .eq('id', characterId)
        .single();

      // For demo, assume +5 modifier
      const modifier = 5;
      const dc = DC_BANDS[dcBand].dc;
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + modifier;
      const success = total >= dc;

      // RAW: Persuasion can improve attitude by one step
      let newAttitude: string | undefined;
      if (success && skillType === 'persuasion') {
        if (currentAttitude === 'hostile') newAttitude = 'indifferent';
        else if (currentAttitude === 'indifferent') newAttitude = 'friendly';
      }

      setResult({ roll, total, success, newAttitude });

      // Update NPC attitude if changed
      if (newAttitude) {
        await supabase
          .from('npcs')
          .update({ attitude: newAttitude })
          .eq('id', npcId);
        
        toast.success(`${npcName}'s attitude improved to ${newAttitude}!`);
      } else if (success) {
        toast.success(`${characterName} succeeds at ${skillType}!`);
      } else {
        toast.error(`${characterName} fails ${skillType} check`);
      }

      setTimeout(() => {
        setOpen(false);
        setResult(null);
      }, 3000);
    } catch (error) {
      console.error('Error rolling social interaction:', error);
      toast.error("Failed to roll check");
    } finally {
      setRolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Social Interaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Social Interaction: {npcName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Attitude */}
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Current Attitude:</span>
                <Badge variant={ATTITUDE_COLORS[currentAttitude] as any}>
                  {currentAttitude}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          {/* Skill Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Social Skill</label>
            <Select value={skillType} onValueChange={(v: any) => setSkillType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="persuasion">Persuasion (improve attitude)</SelectItem>
                <SelectItem value="deception">Deception (mislead)</SelectItem>
                <SelectItem value="intimidation">Intimidation (coerce)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DC Band */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={dcBand} onValueChange={setDcBand}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trivial">DC 5 - Trivial</SelectItem>
                <SelectItem value="easy">DC 10 - Easy</SelectItem>
                <SelectItem value="moderate">DC 15 - Moderate</SelectItem>
                <SelectItem value="hard">DC 20 - Hard</SelectItem>
                <SelectItem value="very_hard">DC 25 - Very Hard</SelectItem>
                <SelectItem value="nearly_impossible">DC 30 - Nearly Impossible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <Dices className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">
                  {result.success ? "✓ Success!" : "✗ Failed!"}
                </div>
                <div className="text-sm">
                  Roll: {result.roll} + 5 = {result.total} vs DC {DC_BANDS[dcBand].dc}
                </div>
                {result.newAttitude && (
                  <div className="text-sm mt-1 text-green-600 font-semibold">
                    Attitude improved: {currentAttitude} → {result.newAttitude}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* RAW Info */}
          {!result && (
            <Alert>
              <AlertDescription className="text-xs">
                <strong>RAW:</strong> Persuasion can improve NPC attitude by one step (hostile → indifferent → friendly). DCs vary by situation (DMG 244-245).
              </AlertDescription>
            </Alert>
          )}

          {/* Roll Button */}
          {!result && (
            <Button
              onClick={handleRoll}
              disabled={rolling}
              className="w-full"
            >
              <Dices className="w-4 h-4 mr-2" />
              Roll {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Check
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
