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
    
    setPlayerId(user.id);

    if (!campaignCode) {
      toast({
        title: 'Invalid link',
        description: 'No campaign code provided',
        variant: 'destructive',
      });
      navigate(`/player/${user.id}`);
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
      navigate(`/player/${user.id}`);
      return;
    }

    setCampaignId(campaign.id);
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
