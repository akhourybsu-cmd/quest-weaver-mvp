import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PlayerWaitingRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const campaignCode = searchParams.get('campaign');
  
  const [checking, setChecking] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    initializeWaitingRoom();
  }, []);

  const initializeWaitingRoom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    // Ensure there is a player profile linked to this auth user
    const { data: existingPlayer, error: playerFetchError } = await supabase
      .from('players')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (playerFetchError) {
      console.error('Failed to load player profile:', playerFetchError);
      toast({
        title: 'Connection error',
        description: 'Could not load your player profile. Please try again.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    let playerRecord = existingPlayer;

    // Auto-create a player profile if one does not exist yet
    if (!playerRecord) {
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          name: user.email || 'Player',
        })
        .select('id, name')
        .single();

      if (createError || !newPlayer) {
        console.error('Failed to create player profile:', createError);
        toast({
          title: 'Connection error',
          description: 'Could not create your player profile. Please try again.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      playerRecord = newPlayer;
    }

    setPlayerId(playerRecord.id);

    if (!campaignCode) {
      toast({
        title: 'Invalid link',
        description: 'No campaign code provided',
        variant: 'destructive',
      });
      navigate(`/player/${playerRecord.id}`);
      return;
    }

    // Get campaign ID
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('code', campaignCode)
      .maybeSingle();

    if (!campaign) {
      toast({
        title: 'Campaign not found',
        description: 'Invalid campaign code',
        variant: 'destructive',
      });
      navigate(`/player/${playerRecord.id}`);
      return;
    }

    setCampaignId(campaign.id);

    // Auto-link player to campaign if not already linked
    const { data: existingLink } = await supabase
      .from('player_campaign_links')
      .select('id')
      .eq('player_id', playerRecord.id)
      .eq('campaign_id', campaign.id)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkError } = await supabase
        .from('player_campaign_links')
        .insert({
          player_id: playerRecord.id,
          campaign_id: campaign.id,
          join_code: campaignCode,
          role: 'player',
        });

      if (linkError) {
        console.error('Failed to link player to campaign:', linkError);
        toast({
          title: 'Connection error',
          description: 'Failed to join campaign. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Campaign joined!',
        description: 'Waiting for DM to start session...',
      });
    }

    checkForLiveSession(campaign.id);

    // Subscribe to campaign updates
    const channel = supabase
      .channel('waiting-for-session')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaign.id}`,
        },
        (payload) => {
          if (payload.new.live_session_id) {
            // Session started! Redirect to player view
            toast({
              title: 'Session started!',
              description: 'Joining now...',
            });
            navigate(`/session/player?campaign=${campaignCode}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };
  const checkForLiveSession = async (campId: string) => {
    const { data } = await supabase
      .from('campaigns')
      .select('live_session_id, campaign_sessions(status)')
      .eq('id', campId)
      .single();

    if (data?.live_session_id && ['live', 'paused'].includes(data.campaign_sessions?.status)) {
      // Session is active, redirect
      navigate(`/session/player?campaign=${campaignCode}`);
    } else {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Waiting for Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking for active session...
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                The DM hasn't started a session yet. You'll be automatically redirected when they do.
              </p>
              <p className="text-sm text-muted-foreground">
                Campaign code: <span className="font-mono font-semibold">{campaignCode}</span>
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(playerId ? `/player/${playerId}` : '/')}
                >
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={() => campaignId && checkForLiveSession(campaignId)}
                  disabled={checking}
                >
                  Check Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
