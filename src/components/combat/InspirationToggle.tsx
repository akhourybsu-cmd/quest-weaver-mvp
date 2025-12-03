import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InspirationToggleProps {
  characterId: string;
  hasInspiration: boolean;
  isDM: boolean;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
}

export function InspirationToggle({
  characterId,
  hasInspiration: initialHasInspiration,
  isDM,
  showLabel = false,
  size = "sm",
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

    const newValue = !hasInspiration;
    
    const { error } = await supabase
      .from('characters')
      .update({ inspiration: newValue })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to toggle inspiration",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: newValue ? "Inspiration Granted" : "Inspiration Used",
      description: newValue 
        ? "Character now has inspiration (advantage on one roll)"
        : "Inspiration has been used",
    });
  };

  const useInspiration = async () => {
    if (!hasInspiration) return;

    const { error } = await supabase
      .from('characters')
      .update({ inspiration: false })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to use inspiration",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Inspiration Used!",
      description: "You gain advantage on one attack roll, saving throw, or ability check",
    });
  };

  const sizeClasses = {
    sm: "h-6 w-6 p-0",
    default: "h-8 px-3",
    lg: "h-10 px-4",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Compact button version
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasInspiration ? "default" : "outline"}
              size="sm"
              onClick={isDM ? toggleInspiration : useInspiration}
              className={`${sizeClasses[size]} ${
                hasInspiration 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'text-muted-foreground hover:text-amber-500'
              }`}
            >
              {hasInspiration ? (
                <Star className={`${iconSizes[size]} fill-current`} />
              ) : (
                <Sparkles className={iconSizes[size]} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Inspiration</p>
            <p className="text-xs text-muted-foreground">
              {hasInspiration 
                ? isDM ? "Click to remove" : "Click to use for advantage"
                : isDM ? "Click to grant inspiration" : "No inspiration"
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full display version with label
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={hasInspiration ? "default" : "outline"}
        className={`cursor-pointer transition-colors ${
          hasInspiration
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
            : 'hover:bg-muted'
        }`}
        onClick={isDM ? toggleInspiration : useInspiration}
      >
        {hasInspiration ? (
          <Star className="h-3 w-3 mr-1 fill-current" />
        ) : (
          <Sparkles className="h-3 w-3 mr-1" />
        )}
        {hasInspiration ? "Inspired" : "No Inspiration"}
      </Badge>
      {hasInspiration && !isDM && (
        <span className="text-xs text-muted-foreground">
          (Click to use for advantage)
        </span>
      )}
    </div>
  );
}

// Hook for checking inspiration in combat rolls
export function useInspiration(characterId: string) {
  const [hasInspiration, setHasInspiration] = useState(false);

  useEffect(() => {
    const fetchInspiration = async () => {
      const { data } = await supabase
        .from('characters')
        .select('inspiration')
        .eq('id', characterId)
        .single();
      
      if (data) {
        setHasInspiration(data.inspiration || false);
      }
    };

    fetchInspiration();

    // Real-time subscription
    const channel = supabase
      .channel(`inspiration-hook:${characterId}`)
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

  const useInspirationForAdvantage = async () => {
    if (!hasInspiration) return false;

    const { error } = await supabase
      .from('characters')
      .update({ inspiration: false })
      .eq('id', characterId);

    if (!error) {
      setHasInspiration(false);
      return true;
    }
    return false;
  };

  return { hasInspiration, useInspirationForAdvantage };
}
