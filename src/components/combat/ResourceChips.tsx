import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Settings } from "lucide-react";

interface Resource {
  current: number;
  max: number;
}

interface ResourceChipsProps {
  characterId: string;
  resources: Record<string, Resource>;
  isDM: boolean;
}

export function ResourceChips({ characterId, resources: initialResources, isDM }: ResourceChipsProps) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [resources, setResources] = useState<Record<string, Resource>>(initialResources || {});
  const [editResources, setEditResources] = useState<Record<string, Resource>>(initialResources || {});

  // Real-time sync for resource changes
  useEffect(() => {
    const channel = supabase
      .channel(`resource-chips:${characterId}`)
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
            if (!editOpen) {
              setEditResources(payload.new.resources);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, editOpen]);

  useEffect(() => {
    setResources(initialResources || {});
    setEditResources(initialResources || {});
  }, [initialResources]);

  const updateResource = async (resourceKey: string, current: number) => {
    const updated = {
      ...resources,
      [resourceKey]: {
        ...resources[resourceKey],
        current: Math.max(0, Math.min(current, resources[resourceKey].max)),
      },
    };

    const { error } = await supabase
      .from('characters')
      .update({ resources: updated as any })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const saveResourceConfig = async () => {
    const { error } = await supabase
      .from('characters')
      .update({ resources: editResources as any })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save resources",
        variant: "destructive",
      });
    } else {
      setEditOpen(false);
      toast({
        title: "Resources Updated",
        description: "Resource configuration saved",
      });
    }
  };

  const addNewResource = () => {
    const key = `resource_${Object.keys(editResources).length + 1}`;
    setEditResources({
      ...editResources,
      [key]: { current: 0, max: 1 },
    });
  };

  const removeResource = (key: string) => {
    const { [key]: _, ...rest } = editResources;
    setEditResources(rest);
  };

  const resourceLabels: Record<string, string> = {
    hit_dice: "HD",
    ki_points: "Ki",
    sorcery_points: "SP",
    superiority_dice: "SD",
    bardic_inspiration: "BI",
    channel_divinity: "CD",
    rage: "Rage",
    wild_shape: "WS",
  };

  return (
    <div className="flex gap-1 items-center">
      {Object.entries(resources || {}).map(([key, resource]) => (
        <div key={key} className="flex items-center gap-0.5">
          {isDM && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => updateResource(key, resource.current - 1)}
              disabled={resource.current <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
          )}
          <Badge variant="outline" className="h-6 px-2 text-xs">
            {resourceLabels[key] || key}: {resource.current}/{resource.max}
          </Badge>
          {isDM && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => updateResource(key, resource.current + 1)}
              disabled={resource.current >= resource.max}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {isDM && (
        <Popover open={editOpen} onOpenChange={setEditOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Configure Resources</h4>
              
              {Object.entries(editResources).map(([key, resource]) => (
                <div key={key} className="space-y-2 border-b pb-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">{key}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(key)}
                      className="h-6 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Current</Label>
                      <Input
                        type="number"
                        value={resource.current}
                        onChange={(e) =>
                          setEditResources({
                            ...editResources,
                            [key]: { ...resource, current: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max</Label>
                      <Input
                        type="number"
                        value={resource.max}
                        onChange={(e) =>
                          setEditResources({
                            ...editResources,
                            [key]: { ...resource, max: parseInt(e.target.value) || 1 },
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={addNewResource} variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" /> Add Resource
              </Button>

              <Button onClick={saveResourceConfig} className="w-full">
                Save Configuration
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
