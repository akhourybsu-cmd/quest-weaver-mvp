import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, CircleDot, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

interface ClassResource {
  name: string;
  total: number;
  used: number;
  resetOn: 'short' | 'long';
}

interface ResourceTrackerProps {
  characterId: string;
  characterName: string;
  resources: {
    spellSlots?: SpellSlot[];
    classResources?: ClassResource[];
  };
  canEdit: boolean;
}

export function ResourceTracker({ 
  characterId, 
  characterName,
  resources: initialResources,
  canEdit 
}: ResourceTrackerProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [resources, setResources] = useState(initialResources);

  // Real-time sync for resource changes
  useEffect(() => {
    const channel = supabase
      .channel(`resources:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          if (payload.new && payload.new.resources) {
            setResources(payload.new.resources);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  const spellSlots = resources.spellSlots || [];
  const classResources = resources.classResources || [];

  const updateSpellSlot = async (level: number, usedDelta: number) => {
    if (!canEdit || isUpdating) return;

    const slot = spellSlots.find(s => s.level === level);
    if (!slot) return;

    const newUsed = Math.max(0, Math.min(slot.total, slot.used + usedDelta));
    if (newUsed === slot.used) return;

    setIsUpdating(true);

    const updatedSlots = spellSlots.map(s => 
      s.level === level ? { ...s, used: newUsed } : s
    );

    const { error } = await supabase
      .from('characters')
      .update({
        resources: {
          ...resources,
          spellSlots: updatedSlots
        } as any
      })
      .eq('id', characterId);

    setIsUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update spell slots",
        variant: "destructive",
      });
    }
  };

  const updateClassResource = async (resourceName: string, usedDelta: number) => {
    if (!canEdit || isUpdating) return;

    const resource = classResources.find(r => r.name === resourceName);
    if (!resource) return;

    const newUsed = Math.max(0, Math.min(resource.total, resource.used + usedDelta));
    if (newUsed === resource.used) return;

    setIsUpdating(true);

    const updatedResources = classResources.map(r => 
      r.name === resourceName ? { ...r, used: newUsed } : r
    );

    const { error } = await supabase
      .from('characters')
      .update({
        resources: {
          ...resources,
          classResources: updatedResources
        } as any
      })
      .eq('id', characterId);

    setIsUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update class resource",
        variant: "destructive",
      });
    }
  };

  const SpellSlotDots = ({ slot }: { slot: SpellSlot }) => {
    const available = slot.total - slot.used;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {Array.from({ length: slot.total }).map((_, i) => (
          <div key={i} className="relative">
            {i < available ? (
              <CircleDot className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (spellSlots.length === 0 && classResources.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resources — {characterName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spell Slots */}
        {spellSlots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Spell Slots</h4>
            {spellSlots.map(slot => (
              <div key={slot.level} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {slot.level === 0 ? 'Cantrip' : `Level ${slot.level}`}
                  </Badge>
                  <SpellSlotDots slot={slot} />
                  <span className="text-xs text-muted-foreground">
                    {slot.total - slot.used}/{slot.total}
                  </span>
                </div>
                {canEdit && slot.level > 0 && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateSpellSlot(slot.level, 1)}
                      disabled={slot.used >= slot.total || isUpdating}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateSpellSlot(slot.level, -1)}
                      disabled={slot.used <= 0 || isUpdating}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Class Resources */}
        {classResources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Class Resources</h4>
            {classResources.map(resource => (
              <div key={resource.name} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium">{resource.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {resource.resetOn === 'short' ? 'Short Rest' : 'Long Rest'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {resource.total - resource.used}/{resource.total}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateClassResource(resource.name, 1)}
                      disabled={resource.used >= resource.total || isUpdating}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateClassResource(resource.name, -1)}
                      disabled={resource.used <= 0 || isUpdating}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
