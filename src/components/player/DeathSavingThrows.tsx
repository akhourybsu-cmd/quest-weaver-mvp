import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skull, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeathSavingThrowsProps {
  characterId: string;
  successes: number;
  failures: number;
  onUpdate: () => void;
}

export function DeathSavingThrows({ characterId, successes, failures, onUpdate }: DeathSavingThrowsProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updateDeathSaves = async (newSuccesses: number, newFailures: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({
          death_save_success: newSuccesses,
          death_save_fail: newFailures,
        })
        .eq("id", characterId);

      if (error) throw error;
      onUpdate();

      if (newSuccesses >= 3) {
        toast({ title: "Stabilized!", description: "You have been stabilized with 3 successful death saves." });
      } else if (newFailures >= 3) {
        toast({ title: "Death", description: "You have failed 3 death saving throws.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addSuccess = () => {
    if (successes < 3) updateDeathSaves(successes + 1, failures);
  };

  const addFailure = () => {
    if (failures < 3) updateDeathSaves(successes, failures + 1);
  };

  const reset = () => updateDeathSaves(0, 0);

  return (
    <div className="relative p-4 rounded-lg bg-gradient-to-br from-destructive/15 to-destructive/5 border-2 border-destructive/30 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Skull className="w-5 h-5 text-destructive" />
        <span className="font-cinzel font-semibold tracking-wide text-destructive">Death Saving Throws</span>
      </div>

      <div className="space-y-3">
        {/* Successes */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Successes</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={`s-${i}`}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    i < successes
                      ? 'bg-primary border-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]'
                      : 'bg-muted/30 border-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 border-primary/50 hover:bg-primary/10"
              onClick={addSuccess}
              disabled={saving || successes >= 3}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Failures */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Failures</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={`f-${i}`}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    i < failures
                      ? 'bg-destructive border-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.5)]'
                      : 'bg-muted/30 border-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 border-destructive/50 hover:bg-destructive/10"
              onClick={addFailure}
              disabled={saving || failures >= 3}
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Reset */}
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          onClick={reset}
          disabled={saving || (successes === 0 && failures === 0)}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset Death Saves
        </Button>
      </div>
    </div>
  );
}
