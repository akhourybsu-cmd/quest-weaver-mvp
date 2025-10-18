import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InspirationToggleProps {
  characterId: string;
  hasInspiration: boolean;
  isDM: boolean;
}

export function InspirationToggle({
  characterId,
  hasInspiration: initialHasInspiration,
  isDM,
}: InspirationToggleProps) {
  const { toast } = useToast();
  const [hasInspiration, setHasInspiration] = useState(initialHasInspiration);

  // Real-time sync for inspiration changes
  useEffect(() => {
    const channel = supabase
      .channel(`inspiration:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.inspiration === 'boolean') {
            setHasInspiration(payload.new.inspiration);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  useEffect(() => {
    setHasInspiration(initialHasInspiration);
  }, [initialHasInspiration]);

  const toggleInspiration = async () => {
    if (!isDM) return;

    const { error } = await supabase
      .from('characters')
      .update({ inspiration: !hasInspiration })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to toggle inspiration",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={hasInspiration ? "default" : "outline"}
      size="sm"
      onClick={toggleInspiration}
      disabled={!isDM}
      className={`h-6 w-6 p-0 ${
        hasInspiration 
          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
          : 'text-muted-foreground'
      }`}
      title="Inspiration"
    >
      <Sparkles className="h-3 w-3" />
    </Button>
  );
}
