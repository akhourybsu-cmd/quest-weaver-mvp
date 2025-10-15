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
  hasInspiration,
  isDM,
}: InspirationToggleProps) {
  const { toast } = useToast();

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
