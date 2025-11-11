export interface Player {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  deviceIds: string[];
  createdAt: number;
}

export interface PlayerCampaignLink {
  id: string;
  player_id: string;
  campaign_id: string;
  join_code: string;
  role: 'player';
  nickname?: string;
  last_joined_at?: string;
  pinned?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignStatus {
  campaignId: string;
  name: string;
  hasLiveSession: boolean;
  sessionId?: string;
}
