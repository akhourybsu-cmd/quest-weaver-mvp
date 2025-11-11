import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wind, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuffocationTrackerProps {
  characterId: string;
  characterName: string;
  conModifier: number;
  encounterId?: string;
}

export function SuffocationTracker({
  characterId,
  characterName,
  conModifier,
  encounterId,
}: SuffocationTrackerProps) {
  const [breathRemaining, setBreathRemaining] = useState<number | null>(null);
  const [isSuffocating, setIsSuffocating] = useState(false);

  useEffect(() => {
    const fetchBreathStatus = async () => {
      const { data } = await supabase
        .from('characters')
        .select('breath_remaining_rounds')
        .eq('id', characterId)
        .single();
      
      if (data?.breath_remaining_rounds !== null) {
        setBreathRemaining(data.breath_remaining_rounds);
        setIsSuffocating(true);
      }
    };

    fetchBreathStatus();

    // Subscribe to changes
    const channel = supabase
      .channel(`suffocation_${characterId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `id=eq.${characterId}`,
      }, (payload: any) => {
        if (payload.new?.breath_remaining_rounds !== null) {
          setBreathRemaining(payload.new.breath_remaining_rounds);
          setIsSuffocating(true);
        } else {
          setBreathRemaining(null);
          setIsSuffocating(false);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [characterId]);

  const handleStartSuffocating = async () => {
    // RAW: Can suffocate for rounds = CON mod (min 1)
    const rounds = Math.max(1, conModifier);
    
    await supabase
      .from('characters')
      .update({ breath_remaining_rounds: rounds })
      .eq('id', characterId);

    toast.warning(`${characterName} is suffocating! ${rounds} rounds remaining.`);
  };

  const handleAdvanceRound = async () => {
    if (breathRemaining === null) return;

    const newRemaining = breathRemaining - 1;

    if (newRemaining <= 0) {
      // RAW: Drop to 0 HP and dying
      await supabase.functions.invoke('apply-damage', {
        body: {
          encounterId,
          targetId: characterId,
          targetType: 'character',
          damage: 999, // Enough to drop to 0
          damageType: 'necrotic',
          source: 'Suffocation',
        },
      });

      await supabase
        .from('characters')
        .update({ breath_remaining_rounds: null })
        .eq('id', characterId);

      toast.error(`${characterName} drops to 0 HP from suffocation!`);
    } else {
      await supabase
        .from('characters')
        .update({ breath_remaining_rounds: newRemaining })
        .eq('id', characterId);

      toast.warning(`${characterName} has ${newRemaining} rounds of breath remaining!`);
    }
  };

  const handleStopSuffocating = async () => {
    await supabase
      .from('characters')
      .update({ breath_remaining_rounds: null })
      .eq('id', characterId);

    toast.success(`${characterName} can breathe again!`);
  };

  if (!isSuffocating) {
    return (
      <Button
        onClick={handleStartSuffocating}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wind className="w-4 h-4" />
        Start Suffocating
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Alert variant={breathRemaining && breathRemaining <= 1 ? "destructive" : "default"}>
        <Skull className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold">⚠ Suffocating!</div>
          <div className="text-sm">
            Breath Remaining: {breathRemaining} rounds
          </div>
          <div className="text-xs mt-1">
            RAW: Can survive {Math.max(1, conModifier)} rounds without breath. Drops to 0 HP when time runs out. (PHB 183)
          </div>
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2">
        <Button
          onClick={handleAdvanceRound}
          size="sm"
          variant="destructive"
        >
          Advance Round (-1)
        </Button>
        <Button
          onClick={handleStopSuffocating}
          size="sm"
          variant="outline"
        >
          Stop Suffocating
        </Button>
      </div>
    </div>
  );
}
