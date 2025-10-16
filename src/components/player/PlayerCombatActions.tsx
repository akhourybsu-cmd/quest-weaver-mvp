import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlayerCombatActionsProps {
  characterId: string;
  encounterId: string;
  isMyTurn: boolean;
}

export function PlayerCombatActions({
  characterId,
  encounterId,
  isMyTurn,
}: PlayerCombatActionsProps) {
  const [actionUsed, setActionUsed] = useState(false);
  const [bonusActionUsed, setBonusActionUsed] = useState(false);
  const [reactionUsed, setReactionUsed] = useState(false);
  const [showEndTurnDialog, setShowEndTurnDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActionEconomy();

    const channel = supabase
      .channel(`player-actions:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        () => fetchActionEconomy()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const fetchActionEconomy = async () => {
    const { data } = await supabase
      .from("characters")
      .select("action_used, bonus_action_used, reaction_used")
      .eq("id", characterId)
      .single();

    if (data) {
      setActionUsed(data.action_used || false);
      setBonusActionUsed(data.bonus_action_used || false);
      setReactionUsed(data.reaction_used || false);
    }
  };

  const handleEndTurn = async () => {
    try {
      // Insert turn signal to notify DM
      const { error } = await supabase
        .from("player_turn_signals")
        .insert({
          encounter_id: encounterId,
          character_id: characterId,
          signal_type: "end_turn",
          message: "Player has ended their turn",
        });

      if (error) throw error;

      toast({
        title: "Turn Ended",
        description: "The DM has been notified that you've completed your turn.",
      });

      setShowEndTurnDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const ActionChip = ({ 
    used, 
    label, 
    fullLabel 
  }: { 
    used: boolean; 
    label: string;
    fullLabel: string;
  }) => (
    <div className="flex items-center gap-2">
      <Badge
        variant={used ? "outline" : "default"}
        className={`h-8 px-3 ${
          used 
            ? 'bg-muted/50 text-muted-foreground line-through' 
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {used ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
        <span className="hidden sm:inline">{fullLabel}</span>
        <span className="sm:hidden">{label}</span>
      </Badge>
    </div>
  );

  if (!isMyTurn) {
    return null;
  }

  return (
    <>
      <Card className="border-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Turn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Available Actions:</p>
            <div className="flex flex-wrap gap-2">
              <ActionChip used={actionUsed} label="A" fullLabel="Action" />
              <ActionChip used={bonusActionUsed} label="B" fullLabel="Bonus Action" />
              <ActionChip used={reactionUsed} label="R" fullLabel="Reaction" />
            </div>
          </div>

          <Button
            onClick={() => setShowEndTurnDialog(true)}
            className="w-full"
            size="lg"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            End My Turn
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showEndTurnDialog} onOpenChange={setShowEndTurnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Your Turn?</AlertDialogTitle>
            <AlertDialogDescription>
              This will notify the DM that you've completed your turn. The DM will advance the initiative order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndTurn}>
              End Turn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
