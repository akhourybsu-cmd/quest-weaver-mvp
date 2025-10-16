import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type CampaignRole = 'DM' | 'PLAYER' | null;

interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'DM' | 'PLAYER';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  code: string;
  dm_user_id: string;
}

interface CampaignContextType {
  campaign: Campaign | null;
  role: CampaignRole;
  member: CampaignMember | null;
  isLoading: boolean;
  viewMode: 'dm' | 'player';
  setViewMode: (mode: 'dm' | 'player') => void;
  refreshRole: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const campaignCode = searchParams.get('code');
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [role, setRole] = useState<CampaignRole>(null);
  const [member, setMember] = useState<CampaignMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<'dm' | 'player'>('dm');

  const setViewMode = (mode: 'dm' | 'player') => {
    setViewModeState(mode);
    if (campaign) {
      localStorage.setItem(`viewMode_${campaign.id}`, mode);
    }
  };

  const fetchCampaignAndRole = async () => {
    if (!campaignCode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('code', campaignCode)
        .single();

      if (campaignError || !campaignData) {
        console.error('Campaign not found:', campaignError);
        setIsLoading(false);
        return;
      }

      setCampaign(campaignData);

      // Fetch member role
      const { data: memberData, error: memberError } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignData.id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        console.error('Member role not found:', memberError);
        setRole(null);
        setMember(null);
      } else {
        const typedMember: CampaignMember = {
          id: memberData.id,
          campaign_id: memberData.campaign_id,
          user_id: memberData.user_id,
          role: memberData.role as 'DM' | 'PLAYER',
          created_at: memberData.created_at,
        };
        setRole(typedMember.role);
        setMember(typedMember);
        
        // Load view mode preference for DMs
        if (memberData.role === 'DM') {
          const savedMode = localStorage.getItem(`viewMode_${campaignData.id}`) as 'dm' | 'player';
          if (savedMode) {
            setViewModeState(savedMode);
          }
        } else {
          setViewModeState('player');
        }
      }
    } catch (error) {
      console.error('Error fetching campaign/role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignAndRole();
  }, [campaignCode]);

  // Subscribe to campaign_members changes
  useEffect(() => {
    if (!campaign) return;

    const channel = supabase
      .channel('campaign-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_members',
          filter: `campaign_id=eq.${campaign.id}`,
        },
        () => {
          fetchCampaignAndRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign?.id]);

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        role,
        member,
        isLoading,
        viewMode,
        setViewMode,
        refreshRole: fetchCampaignAndRole,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
