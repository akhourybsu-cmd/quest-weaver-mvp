import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CombatModifier {
  id: string;
  modifier_type: string;
  source: string;
  expires_at: string;
}

interface CombatModifierManagerProps {
  encounterId: string;
  actorId: string;
  actorType: 'character' | 'monster';
  actorName: string;
  isDM: boolean;
}

const CombatModifierManager = ({
  encounterId,
  actorId,
  actorType,
  actorName,
  isDM,
}: CombatModifierManagerProps) => {
  const [modifiers, setModifiers] = useState<CombatModifier[]>([]);
  const [newModifierType, setNewModifierType] = useState<string>('advantage');
  const [newSource, setNewSource] = useState<string>('');
  const [newExpires, setNewExpires] = useState<string>('end_of_turn');
  const { toast } = useToast();

  useEffect(() => {
    loadModifiers();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`modifiers-${actorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combat_modifiers',
          filter: `actor_id=eq.${actorId}`,
        },
        () => {
          loadModifiers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actorId]);

  const loadModifiers = async () => {
    const { data } = await supabase
      .from('combat_modifiers')
      .select('*')
      .eq('encounter_id', encounterId)
      .eq('actor_id', actorId)
      .eq('actor_type', actorType)
      .order('created_at', { ascending: false });

    if (data) {
      setModifiers(data);
    }
  };

  const addModifier = async () => {
    if (!newSource.trim()) {
      toast({
        title: "Source required",
        description: "Please provide a source for this modifier",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('combat_modifiers').insert({
      encounter_id: encounterId,
      actor_id: actorId,
      actor_type: actorType,
      modifier_type: newModifierType,
      source: newSource,
      expires_at: newExpires,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Modifier added",
        description: `${newModifierType} from ${newSource}`,
      });
      setNewSource('');
    }
  };

  const removeModifier = async (id: string) => {
    const { error } = await supabase
      .from('combat_modifiers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Modifier removed",
      });
    }
  };

  const getModifierLabel = (type: string) => {
    switch(type) {
      case 'advantage': return 'ADV';
      case 'disadvantage': return 'DIS';
      case 'cover_half': return '+2 AC';
      case 'cover_three_quarters': return '+5 AC';
      case 'cover_full': return 'Full Cover';
      default: return type;
    }
  };

  const getModifierVariant = (type: string) => {
    if (type === 'advantage') return 'default';
    if (type === 'disadvantage') return 'destructive';
    return 'secondary';
  };

  if (!isDM) {
    // Players just see their active modifiers
    return (
      <div className="flex gap-1 flex-wrap">
        {modifiers.map(mod => (
          <Badge key={mod.id} variant={getModifierVariant(mod.modifier_type)}>
            {getModifierLabel(mod.modifier_type)}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          Modifiers
          {modifiers.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {modifiers.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Active Modifiers - {actorName}</h4>
            {modifiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active modifiers</p>
            ) : (
              <div className="space-y-2">
                {modifiers.map(mod => (
                  <div key={mod.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={getModifierVariant(mod.modifier_type)}>
                        {getModifierLabel(mod.modifier_type)}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">{mod.source}</div>
                        <div className="text-xs text-muted-foreground">
                          Until {mod.expires_at.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModifier(mod.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label>Add Modifier</Label>
            
            <Select value={newModifierType} onValueChange={setNewModifierType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advantage">Advantage</SelectItem>
                <SelectItem value="disadvantage">Disadvantage</SelectItem>
                <SelectItem value="cover_half">Half Cover (+2 AC)</SelectItem>
                <SelectItem value="cover_three_quarters">Three-Quarters Cover (+5 AC)</SelectItem>
                <SelectItem value="cover_full">Full Cover</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Source (e.g., Prone, Spell, etc.)"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
            />

            <Select value={newExpires} onValueChange={setNewExpires}>
              <SelectTrigger>
                <SelectValue placeholder="Expires..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end_of_turn">End of Turn</SelectItem>
                <SelectItem value="start_of_turn">Start of Turn</SelectItem>
                <SelectItem value="end_of_round">End of Round</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="manual">Manual Remove</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={addModifier} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Modifier
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CombatModifierManager;
