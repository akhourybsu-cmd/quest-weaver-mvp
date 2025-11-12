import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerCampaignLink, CampaignStatus } from '@/types/player';
import { useToast } from '@/hooks/use-toast';

export const usePlayerLinks = (playerId?: string) => {
  const [links, setLinks] = useState<PlayerCampaignLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (playerId) {
      loadLinks();
    } else {
      setLoading(false);
    }
  }, [playerId]);

  const loadLinks = async () => {
    if (!playerId) return;
    
    try {
      const { data, error } = await supabase
        .from('player_campaign_links')
        .select('*')
        .eq('player_id', playerId)
        .order('pinned', { ascending: false })
        .order('last_joined_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setLinks((data || []) as PlayerCampaignLink[]);
    } catch (error: any) {
      console.error('Failed to load campaign links:', error);
      toast({
        title: 'Error loading campaigns',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const linkCampaign = useCallback(async (code: string): Promise<{ success: boolean; campaignId?: string }> => {
    if (!playerId) return { success: false };

    try {
      // Validate code and get campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('code', code)
        .maybeSingle();

      if (campaignError) throw campaignError;
      if (!campaign) {
        toast({
          title: 'Invalid code',
          description: 'Campaign not found with this code',
          variant: 'destructive',
        });
        return { success: false };
      }

      // Check if already linked
      const { data: existing } = await supabase
        .from('player_campaign_links')
        .select('id')
        .eq('player_id', playerId)
        .eq('campaign_id', campaign.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Already linked',
          description: 'You are already linked to this campaign',
        });
        return { success: true, campaignId: campaign.id };
      }

      // Create link
      const { error: insertError } = await supabase
        .from('player_campaign_links')
        .insert({
          player_id: playerId,
          campaign_id: campaign.id,
          join_code: code,
          role: 'player',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Campaign linked!',
        description: `You're now linked to ${campaign.name}`,
      });

      await loadLinks();
      return { success: true, campaignId: campaign.id };
    } catch (error: any) {
      console.error('Failed to link campaign:', error);
      toast({
        title: 'Error linking campaign',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [playerId, toast]);

  const unlinkCampaign = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('player_campaign_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: 'Campaign unlinked',
        description: 'Successfully removed campaign link',
      });

      await loadLinks();
    } catch (error: any) {
      console.error('Failed to unlink campaign:', error);
      toast({
        title: 'Error unlinking campaign',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const togglePin = useCallback(async (linkId: string, pinned: boolean) => {
    try {
      const { error } = await supabase
        .from('player_campaign_links')
        .update({ pinned })
        .eq('id', linkId);

      if (error) throw error;
      await loadLinks();
    } catch (error: any) {
      console.error('Failed to toggle pin:', error);
    }
  }, []);

  const updateLastJoined = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('player_campaign_links')
        .update({ last_joined_at: new Date().toISOString() })
        .eq('id', linkId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to update last joined:', error);
    }
  }, []);

  const getCampaignStatus = useCallback(async (campaignId: string): Promise<CampaignStatus | null> => {
    try {
      // First get campaign with live_session_id
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('live_session_id, name')
        .eq('id', campaignId)
        .maybeSingle();

      if (!campaign) return null;

      // If there's a live session, fetch it
      let sessionData = null;
      if (campaign.live_session_id) {
        const { data } = await supabase
          .from('campaign_sessions')
          .select('id, status')
          .eq('id', campaign.live_session_id)
          .maybeSingle();
        
        sessionData = data;
      }

      const hasLiveSession = 
        !!campaign.live_session_id && 
        sessionData &&
        ['live', 'paused'].includes(sessionData.status);

      return {
        campaignId,
        name: campaign.name,
        hasLiveSession,
        sessionId: sessionData?.id,
        sessionStatus: sessionData?.status,
      };
    } catch (error) {
      console.error('Failed to get campaign status:', error);
      return null;
    }
  }, []);

  return {
    links,
    loading,
    linkCampaign,
    unlinkCampaign,
    togglePin,
    updateLastJoined,
    getCampaignStatus,
    refreshLinks: loadLinks,
  };
};
