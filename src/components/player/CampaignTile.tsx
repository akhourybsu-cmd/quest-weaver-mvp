import { useState, useEffect } from 'react';
import { PlayerCampaignLink, CampaignStatus } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Swords, Link2Off, Pin, PinOff, User, Eye } from 'lucide-react';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { resilientChannel } from '@/lib/realtime';
import CharacterSelectionDialog from '@/components/character/CharacterSelectionDialog';

interface CampaignTileProps {
  link: PlayerCampaignLink;
  playerId: string;
  onUnlink: () => void;
}

export const CampaignTile = ({ link, playerId, onUnlink }: CampaignTileProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCampaignStatus, togglePin, updateLastJoined, unlinkCampaign } = usePlayerLinks(playerId);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<any>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [combatActive, setCombatActive] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadStatus();
    loadCharacter();
    checkCombatStatus();
    checkUnreadMessages();
  }, [link.campaign_id]);

  useEffect(() => {
    const channel = resilientChannel(supabase, `campaign:${link.campaign_id}`);

    channel
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'campaigns',
        filter: `id=eq.${link.campaign_id}`
      }, (payload) => {
        const hadLive = status?.hasLiveSession;
        loadStatus();
        // If session just went live, show a toast
        if (!hadLive && payload.new.live_session_id) {
          toast({ title: '🔴 Session is Live!', description: 'The DM has started a session. Join now!' });
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'campaign_sessions',
        filter: `campaign_id=eq.${link.campaign_id}`
      }, () => { loadStatus(); })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'encounters',
        filter: `campaign_id=eq.${link.campaign_id}`
      }, () => { checkCombatStatus(); })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'campaign_messages',
        filter: `campaign_id=eq.${link.campaign_id}`
      }, () => { checkUnreadMessages(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [link.campaign_id]);

  const loadStatus = async () => {
    setLoading(true);
    const campaignStatus = await getCampaignStatus(link.campaign_id);
    setStatus(campaignStatus);
    setLoading(false);
  };

  const loadCharacter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, level, portrait_url')
        .eq('campaign_id', link.campaign_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setCharacter(data);
    } catch (error) {
      console.error('Error loading character:', error);
    }
  };

  const checkCombatStatus = async () => {
    try {
      const { data } = await supabase
        .from('encounters')
        .select('id, status')
        .eq('campaign_id', link.campaign_id)
        .eq('is_active', true)
        .in('status', ['active', 'preparing'])
        .maybeSingle();
      setCombatActive(!!data);
    } catch (error) {
      console.error('Error checking combat status:', error);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('campaign_messages')
        .select('id')
        .eq('campaign_id', link.campaign_id)
        .gt('created_at', link.last_joined_at || new Date(0).toISOString())
        .neq('sender_id', user.id);
      if (error) throw error;
      setUnreadMessages(data?.length || 0);
    } catch (error) {
      console.error('Error checking messages:', error);
    }
  };

  const handleJoinSession = async () => {
    await updateLastJoined(link.id);
    if (status?.hasLiveSession && status.sessionId) {
      navigate(`/session/player?campaign=${link.join_code}`);
    }
    // When offline, do nothing — player stays on dashboard
  };

  const handleUnlink = async () => {
    await unlinkCampaign(link.id);
    onUnlink();
    setShowUnlinkConfirm(false);
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="outline">Loading...</Badge>;
    if (!status) return <Badge variant="outline">Offline</Badge>;
    if (status.hasLiveSession) {
      if (status.sessionStatus === 'paused') return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏸️ Paused</Badge>;
      return <Badge className="bg-green-500 hover:bg-green-600">🔴 Live</Badge>;
    }
    return <Badge variant="outline">Offline</Badge>;
  };

  return (
    <>
      <Card className="rounded-2xl shadow-xl border-brass/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="font-cinzel text-xl text-foreground">
              {status?.name || 'Loading...'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => togglePin(link.id, !link.pinned)}>
                {link.pinned ? <Pin className="w-4 h-4 text-brass" /> : <PinOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUnlinkConfirm(true)}
                className="text-destructive"
              >
                <Link2Off className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Code: <span className="font-mono font-semibold">{link.join_code}</span>
            </p>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {combatActive && (
                <Badge variant="destructive" className="text-xs">
                  <Swords className="w-3 h-3 mr-1" />Combat
                </Badge>
              )}
              {unreadMessages > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadMessages} new</Badge>
              )}
            </div>
          </div>

          {character ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border">
              <Avatar className="w-10 h-10 border-2 border-brass/30">
                <AvatarImage src={character.portrait_url} />
                <AvatarFallback className="bg-brass/10 text-brass font-cinzel">
                  {character.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{character.name}</p>
                <p className="text-xs text-muted-foreground">Level {character.level} {character.class}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCharacterSelect(true)}>Change</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowCharacterSelect(true)}>
              <User className="w-4 h-4 mr-2" />Select Character
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/player/campaign/${link.join_code}`)}>
              <Eye className="w-4 h-4 mr-2" />View Campaign
            </Button>
            {status?.hasLiveSession ? (
              <Button className="flex-1" onClick={handleJoinSession} disabled={loading || !character}>
                <Swords className="w-4 h-4 mr-2" />Join Session
              </Button>
            ) : (
              <Button className="flex-1" variant="outline" disabled>
                <Swords className="w-4 h-4 mr-2" />No Session
              </Button>
            )}
          </div>
        </CardContent>

        <CharacterSelectionDialog
          open={showCharacterSelect}
          campaignId={link.campaign_id}
          onComplete={() => { setShowCharacterSelect(false); loadCharacter(); }}
          onCancel={() => setShowCharacterSelect(false)}
        />
      </Card>

      <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your link to "{status?.name || 'this campaign'}". Your characters won't be deleted, but they'll be unassigned. You can rejoin later with the campaign code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
