import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/player';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePlayer = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrCreatePlayer();
  }, []);

  const loadOrCreatePlayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if player profile exists
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingPlayer) {
        setPlayer(existingPlayer as Player);
      } else {
        // Auto-create player profile from user metadata
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player',
            color: '#8B7355',
            avatar_url: user.user_metadata?.avatar_url,
          })
          .select()
          .single();

        if (createError) throw createError;
        setPlayer(newPlayer as Player);
      }
    } catch (error: any) {
      console.error('Failed to load player:', error);
      toast({
        title: 'Error loading player profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlayer = useCallback(async (updates: Partial<Player>) => {
    if (!player) return;

    try {
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', player.id);

      if (error) throw error;

      setPlayer({ ...player, ...updates });
      toast({
        title: 'Profile updated',
        description: 'Your player profile has been updated',
      });
    } catch (error: any) {
      console.error('Failed to update player:', error);
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [player, toast]);

  return {
    player,
    loading,
    updatePlayer,
    refreshPlayer: loadOrCreatePlayer,
  };
};
