import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Swords, Shield, MessageSquare, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AssetCounts {
  characters: number;
  campaignsAsDM: number;
  campaignsAsPlayer: number;
  forumTopics: number;
  forumReplies: number;
}

interface AssetItem {
  id: string;
  name: string;
}

const LinkedAssetsSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<AssetCounts>({ characters: 0, campaignsAsDM: 0, campaignsAsPlayer: 0, forumTopics: 0, forumReplies: 0 });
  const [characters, setCharacters] = useState<AssetItem[]>([]);
  const [dmCampaigns, setDmCampaigns] = useState<AssetItem[]>([]);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [charRes, dmRes, playerRes, topicRes, replyRes] = await Promise.all([
      supabase.from('characters').select('id, name').eq('user_id', user.id),
      supabase.from('campaigns').select('id, name').eq('dm_user_id', user.id),
      supabase.from('player_campaign_links').select('*', { count: 'exact', head: true }).eq('player_id', user.id),
      supabase.from('forum_topics').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('forum_replies').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
    ]);

    // player_campaign_links uses player_id which is the players table id, not user_id
    // We need to get the player id first
    const { data: playerData } = await supabase.from('players').select('id').eq('user_id', user.id).single();
    let playerCampaignCount = 0;
    if (playerData) {
      const { count } = await supabase.from('player_campaign_links').select('*', { count: 'exact', head: true }).eq('player_id', playerData.id);
      playerCampaignCount = count || 0;
    }

    setCharacters((charRes.data || []).map(c => ({ id: c.id, name: c.name })));
    setDmCampaigns((dmRes.data || []).map(c => ({ id: c.id, name: c.name })));
    setCounts({
      characters: charRes.data?.length || 0,
      campaignsAsDM: dmRes.data?.length || 0,
      campaignsAsPlayer: playerCampaignCount,
      forumTopics: topicRes.count || 0,
      forumReplies: replyRes.count || 0,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brass" />
        </CardContent>
      </Card>
    );
  }

  const assetGroups = [
    {
      icon: <Swords className="w-5 h-5 text-brass" />,
      label: 'Characters',
      count: counts.characters,
      items: characters,
      onClick: (id: string) => navigate(`/characters/${id}`),
    },
    {
      icon: <Shield className="w-5 h-5 text-brass" />,
      label: 'Campaigns (as DM)',
      count: counts.campaignsAsDM,
      items: dmCampaigns,
      onClick: (id: string) => navigate(`/campaigns/${id}`),
    },
    {
      icon: <Users className="w-5 h-5 text-brass" />,
      label: 'Campaigns (as Player)',
      count: counts.campaignsAsPlayer,
      items: [],
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-brass" />,
      label: 'Forum Activity',
      count: counts.forumTopics + counts.forumReplies,
      items: [],
      subtitle: `${counts.forumTopics} topics · ${counts.forumReplies} replies`,
    },
  ];

  return (
    <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="font-cinzel text-2xl text-brass tracking-wide">My Assets</CardTitle>
        <CardDescription>Overview of your content across Quest Weaver</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assetGroups.map((group, i) => (
          <div key={group.label}>
            {i > 0 && <div className="h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent mb-4" />}
            <div className="flex items-center gap-3 mb-2">
              {group.icon}
              <span className="font-cinzel font-semibold">{group.label}</span>
              <Badge variant="secondary" className="ml-auto">{group.count}</Badge>
            </div>
            {group.subtitle && (
              <p className="text-xs text-muted-foreground ml-8">{group.subtitle}</p>
            )}
            {group.items.length > 0 && (
              <div className="ml-8 space-y-1">
                {group.items.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    onClick={() => group.onClick?.(item.id)}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-brass transition-colors w-full text-left py-1"
                  >
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    {item.name}
                  </button>
                ))}
                {group.items.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{group.items.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LinkedAssetsSection;
