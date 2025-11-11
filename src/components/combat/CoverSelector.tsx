import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Shield, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoverSelectorProps {
  encounterId: string;
  actorId: string;
  actorType: 'character' | 'monster';
  currentCover?: string;
  onCoverChange?: (cover: string) => void;
}

const COVER_OPTIONS = [
  { value: 'none', label: 'No Cover', bonus: 0, description: 'No protection' },
  { value: 'half', label: 'Half Cover', bonus: 2, description: '+2 AC and DEX saves' },
  { value: 'three_quarters', label: '3/4 Cover', bonus: 5, description: '+5 AC and DEX saves' },
  { value: 'full', label: 'Full Cover', bonus: 0, description: 'Cannot be targeted directly' },
];

const CoverSelector = ({
  encounterId,
  actorId,
  actorType,
  currentCover = 'none',
  onCoverChange,
}: CoverSelectorProps) => {
  const [cover, setCover] = useState(currentCover);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleCoverChange = async (newCover: string) => {
    setCover(newCover);
    setOpen(false);

    try {
      if (newCover === 'none') {
        // Remove cover modifier
        await supabase
          .from('combat_modifiers')
          .delete()
          .eq('encounter_id', encounterId)
          .eq('actor_id', actorId)
          .eq('actor_type', actorType)
          .eq('modifier_type', 'cover');
      } else {
        // Check if cover modifier exists
        const { data: existing } = await supabase
          .from('combat_modifiers')
          .select('id')
          .eq('encounter_id', encounterId)
          .eq('actor_id', actorId)
          .eq('actor_type', actorType)
          .eq('modifier_type', 'cover')
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from('combat_modifiers')
            .update({
              cover_type: newCover,
              source: `${COVER_OPTIONS.find(o => o.value === newCover)?.label}`,
            })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase
            .from('combat_modifiers')
            .insert({
              encounter_id: encounterId,
              actor_id: actorId,
              actor_type: actorType,
              modifier_type: 'cover',
              cover_type: newCover,
              source: `${COVER_OPTIONS.find(o => o.value === newCover)?.label}`,
              expires_at: 'manual',
            });
        }
      }

      const option = COVER_OPTIONS.find(o => o.value === newCover);
      toast({
        title: "Cover Updated",
        description: option?.description,
      });

      onCoverChange?.(newCover);
    } catch (error) {
      console.error('Error updating cover:', error);
      toast({
        title: "Error",
        description: "Failed to update cover",
        variant: "destructive",
      });
    }
  };

  const currentOption = COVER_OPTIONS.find(o => o.value === cover);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          {currentOption?.label}
          {currentOption?.bonus > 0 && (
            <Badge variant="secondary" className="ml-1">
              +{currentOption.bonus}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-1">
          {COVER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={cover === option.value ? "default" : "ghost"}
              className="w-full justify-between"
              onClick={() => handleCoverChange(option.value)}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
              {cover === option.value && <Check className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CoverSelector;
