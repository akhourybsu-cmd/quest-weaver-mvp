import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, SkipForward, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TurnSignal {
  id: string;
  character_id: string;
  signal_type: string;
  message: string;
  acknowledged_by_dm: boolean;
  created_at: string;
  character_name?: string;
}

interface PlayerTurnSignalsProps {
  encounterId: string;
}

export function PlayerTurnSignals({ encounterId }: PlayerTurnSignalsProps) {
  const [signals, setSignals] = useState<TurnSignal[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel(`turn-signals:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_turn_signals',
          filter: `encounter_id=eq.${encounterId}`,
        },
        (payload) => {
          console.log('Turn signal change:', payload);
          fetchSignals();
          
          // Show toast for new signals
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Player Ready!",
              description: "A player has ended their turn",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('player_turn_signals')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('acknowledged_by_dm', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching signals:', error);
      return;
    }

    // Fetch character names
    const signalsWithNames = await Promise.all(
      (data || []).map(async (signal) => {
        const { data: char } = await supabase
          .from('characters')
          .select('name')
          .eq('id', signal.character_id)
          .single();

        return {
          ...signal,
          character_name: char?.name || 'Unknown',
        };
      })
    );

    setSignals(signalsWithNames);
  };

  const handleAcknowledge = async (signalId: string) => {
    const { error } = await supabase
      .from('player_turn_signals')
      .update({ acknowledged_by_dm: true })
      .eq('id', signalId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchSignals();
  };

  const handleDismiss = async (signalId: string) => {
    const { error } = await supabase
      .from('player_turn_signals')
      .delete()
      .eq('id', signalId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchSignals();
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from('player_turn_signals')
      .delete()
      .eq('encounter_id', encounterId)
      .eq('acknowledged_by_dm', false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Signals Cleared",
      description: "All turn signals have been cleared",
    });

    fetchSignals();
  };

  if (signals.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 animate-pulse" />
            Player Turn Signals
            <Badge variant="default" className="ml-2">
              {signals.length}
            </Badge>
          </CardTitle>
          {signals.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={signals.length > 3 ? "h-[200px]" : ""}>
          <div className="space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between gap-2 p-3 bg-card rounded-lg border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <SkipForward className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{signal.character_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {signal.message || "Ready to end turn"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAcknowledge(signal.id)}
                    title="Acknowledge"
                  >
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(signal.id)}
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
