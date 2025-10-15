import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActionEconomyProps {
  characterId: string;
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  isDM: boolean;
}

export function ActionEconomy({
  characterId,
  actionUsed,
  bonusActionUsed,
  reactionUsed,
  isDM,
}: ActionEconomyProps) {
  const { toast } = useToast();

  const toggleAction = async (actionType: 'action' | 'bonus_action' | 'reaction') => {
    if (!isDM) return;

    const field = actionType === 'action' ? 'action_used' 
      : actionType === 'bonus_action' ? 'bonus_action_used' 
      : 'reaction_used';
    
    const currentValue = actionType === 'action' ? actionUsed 
      : actionType === 'bonus_action' ? bonusActionUsed 
      : reactionUsed;

    const { error } = await supabase
      .from('characters')
      .update({ [field]: !currentValue })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update action economy",
        variant: "destructive",
      });
    }
  };

  const ActionChip = ({ 
    used, 
    label, 
    onClick 
  }: { 
    used: boolean; 
    label: string; 
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={!isDM}
      className={`h-6 px-2 text-xs ${
        used 
          ? 'bg-muted/50 text-muted-foreground line-through' 
          : 'bg-background hover:bg-accent'
      }`}
    >
      {used ? <X className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
      {label}
    </Button>
  );

  return (
    <div className="flex gap-1">
      <ActionChip 
        used={actionUsed} 
        label="A" 
        onClick={() => toggleAction('action')}
      />
      <ActionChip 
        used={bonusActionUsed} 
        label="B" 
        onClick={() => toggleAction('bonus_action')}
      />
      <ActionChip 
        used={reactionUsed} 
        label="R" 
        onClick={() => toggleAction('reaction')}
      />
    </div>
  );
}
