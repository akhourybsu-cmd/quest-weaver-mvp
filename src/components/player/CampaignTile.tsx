import { useState, useEffect } from 'react';
import { PlayerCampaignLink, CampaignStatus } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Link2Off, Pin, PinOff, User } from 'lucide-react';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CharacterSelectionDialog from '@/components/character/CharacterSelectionDialog';

interface CampaignTileProps {
  link: PlayerCampaignLink;
  playerId: string;
  onUnlink: () => void;
}

export const CampaignTile = ({ link, playerId, onUnlink }: CampaignTileProps) => {
  const navigate = useNavigate();
  const { getCampaignStatus, togglePin, updateLastJoined } = usePlayerLinks(playerId);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<any>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  useEffect(() => {
    loadStatus();
    loadCharacter();
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

  const handleJoinSession = async () => {
    await updateLastJoined(link.id);
    
    if (status?.hasLiveSession && status.sessionId) {
      navigate(`/session/player?campaign=${link.join_code}`);
    } else {
      navigate(`/player/waiting?campaign=${link.join_code}`);
    }
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="outline">Loading...</Badge>;
    if (!status) return <Badge variant="outline">Offline</Badge>;
    if (status.hasLiveSession) return <Badge className="bg-primary">Live</Badge>;
    return <Badge variant="outline">Waiting</Badge>;
  };

  return (
    <Card className="rounded-2xl shadow-xl border-brass/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="font-cinzel text-xl text-foreground">
            {status?.name || 'Loading...'}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePin(link.id, !link.pinned)}
            >
              {link.pinned ? (
                <Pin className="w-4 h-4 text-brass" />
              ) : (
                <PinOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUnlink}
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
          {getStatusBadge()}
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
              <p className="text-xs text-muted-foreground">
                Level {character.level} {character.class}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCharacterSelect(true)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCharacterSelect(true)}
          >
            <User className="w-4 h-4 mr-2" />
            Select Character
          </Button>
        )}
        
        <Button 
          className="w-full" 
          onClick={handleJoinSession}
          disabled={loading || !status || !character}
        >
          <Swords className="w-4 h-4 mr-2" />
          Join Session
        </Button>
      </CardContent>
      
      <CharacterSelectionDialog
        open={showCharacterSelect}
        campaignId={link.campaign_id}
        onComplete={() => {
          setShowCharacterSelect(false);
          loadCharacter();
        }}
        onCancel={() => setShowCharacterSelect(false)}
      />
    </Card>
  );
};
