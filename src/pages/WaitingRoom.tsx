import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/hooks/usePlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WaitingRoom = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getPlayer } = usePlayer();

  const [campaignName, setCampaignName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const player = playerId ? getPlayer(playerId) : null;

  useEffect(() => {
    if (!campaignId) {
      navigate('/player');
      return;
    }

    loadCampaign();
    subscribeToEncounters();
  }, [campaignId]);

  const loadCampaign = async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('name, code')
        .eq('id', campaignId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: 'Campaign not found',
          variant: 'destructive',
        });
        navigate(`/player/${playerId}`);
        return;
      }

      setCampaignName(data.name);

      // Check if there's already an active session
      const { data: encounter } = await supabase
        .from('encounters')
        .select('id')
        .eq('campaign_id', campaignId)
        .in('status', ['active', 'paused'])
        .maybeSingle();

      if (encounter) {
        // Session already live, navigate
        const link = await supabase
          .from('player_campaign_links')
          .select('join_code')
          .eq('campaign_id', campaignId)
          .eq('player_id', playerId)
          .maybeSingle();

        if (link.data) {
          navigate(`/session-player?campaign=${link.data.join_code}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to load campaign:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToEncounters = () => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encounters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        async (payload) => {
          const newEncounter = payload.new as any;
          if (newEncounter.status === 'active' || newEncounter.status === 'paused') {
            toast({
              title: 'Session Starting!',
              description: 'The DM has started a session',
            });

            // Get join code and navigate
            const { data: link } = await supabase
              .from('player_campaign_links')
              .select('join_code')
              .eq('campaign_id', campaignId)
              .eq('player_id', playerId)
              .maybeSingle();

            if (link) {
              setTimeout(() => {
                navigate(`/session-player?campaign=${link.join_code}`);
              }, 1500);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Player not found</p>
          <Button onClick={() => navigate('/player')}>Back to Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="rounded-2xl shadow-xl border-brass/30 max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Dice6 className="w-10 h-10 text-brass" />
          </div>
          <CardTitle className="font-cinzel text-3xl">{campaignName}</CardTitle>
          <CardDescription className="text-lg">
            Waiting for session to start...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Info */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-4"
              style={{
                borderColor: player.color,
                background: `linear-gradient(135deg, ${player.color}20, ${player.color}40)`,
                color: player.color,
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{player.name}</p>
              <p className="text-sm text-muted-foreground">Ready to play</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>Waiting for DM to start the session</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>Other players may be joining</span>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">
              <strong className="text-brass">Pro Tip:</strong> Make sure your character is ready and 
              your dice are handy. You'll be automatically taken to the session when it starts!
            </p>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            onClick={() => navigate(`/player/${playerId}`)}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingRoom;
