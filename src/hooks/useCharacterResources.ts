import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CharacterResource {
  id: string;
  character_id: string;
  resource_key: string;
  label: string;
  current_value: number;
  max_value: number;
  max_formula: string;
  recharge: 'short' | 'long' | 'daily' | 'never' | 'manual';
  metadata_json: Record<string, any>;
}

export function useCharacterResources(characterId: string | null) {
  const [resources, setResources] = useState<CharacterResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    loadResources();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`character-resources:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_resources',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          loadResources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadResources = async () => {
    if (!characterId) return;

    try {
      const { data, error } = await supabase
        .from('character_resources')
        .select('*')
        .eq('character_id', characterId)
        .order('label');

      if (error) throw error;
      setResources((data || []) as CharacterResource[]);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load character resources');
    } finally {
      setLoading(false);
    }
  };

  const updateResource = async (resourceId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('character_resources')
        .update({ current_value: newValue })
        .eq('id', resourceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    }
  };

  const restoreResources = async (restType: 'short' | 'long') => {
    if (!characterId) return;

    try {
      // Get all resources that should be restored
      const resourcesToRestore = resources.filter(
        (r) => restType === 'long' || r.recharge === 'short'
      );

      // Update them in parallel
      const updates = resourcesToRestore.map((resource) =>
        supabase
          .from('character_resources')
          .update({ current_value: resource.max_value })
          .eq('id', resource.id)
      );

      await Promise.all(updates);
      
      toast.success(`Resources restored from ${restType} rest`);
      await loadResources();
    } catch (error) {
      console.error('Error restoring resources:', error);
      toast.error('Failed to restore resources');
    }
  };

  return {
    resources,
    loading,
    updateResource,
    restoreResources,
    reload: loadResources
  };
}
