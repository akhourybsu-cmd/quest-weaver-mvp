import { useState, useEffect } from 'react';
import { PlayerCampaignLink, CampaignStatus } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Link2Off, Pin, PinOff } from 'lucide-react';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    loadStatus();
  }, [link.campaign_id]);

  const loadStatus = async () => {
    setLoading(true);
    const campaignStatus = await getCampaignStatus(link.campaign_id);
    setStatus(campaignStatus);
    setLoading(false);
  };

  const handleJoinSession = async () => {
    await updateLastJoined(link.id);
    
    if (status?.hasLiveSession && status.sessionId) {
      navigate(`/session-player?campaign=${link.join_code}`);
    } else {
      navigate(`/player/${playerId}/waiting?campaign=${link.campaign_id}`);
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
        
        <Button 
          className="w-full" 
          onClick={handleJoinSession}
          disabled={loading || !status}
        >
          <Swords className="w-4 h-4 mr-2" />
          Join Session
        </Button>
      </CardContent>
    </Card>
  );
};
