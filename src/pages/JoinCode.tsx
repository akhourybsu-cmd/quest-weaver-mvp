import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice6, UserPlus } from 'lucide-react';
import { PlayerCard } from '@/components/player/PlayerCard';

const JoinCode = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { players, loading: playersLoading, getLastPlayerId } = usePlayer();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { linkCampaign } = usePlayerLinks(selectedPlayerId || undefined);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!code) {
      navigate('/player');
      return;
    }

    // Auto-select if there's only one player
    if (!playersLoading && players.length === 1) {
      handleSelectPlayer(players[0].id);
    } else if (!playersLoading && players.length > 1) {
      const lastPlayerId = getLastPlayerId();
      if (lastPlayerId && players.find(p => p.id === lastPlayerId)) {
        setSelectedPlayerId(lastPlayerId);
      }
    }
  }, [code, players, playersLoading]);

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  const handleLink = async () => {
    if (!selectedPlayerId || !code || linking) return;

    setLinking(true);
    const result = await linkCampaign(code.toUpperCase());
    setLinking(false);

    if (result.success && result.campaignId) {
      navigate(`/player/${selectedPlayerId}/waiting?campaign=${result.campaignId}`);
    }
  };

  if (playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="rounded-2xl shadow-xl border-brass/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dice6 className="w-8 h-8 text-brass" />
            </div>
            <CardTitle className="font-cinzel text-2xl">Welcome to Quest Weaver</CardTitle>
            <CardDescription>
              Create a player profile to join this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Campaign Code: <span className="font-mono font-bold text-foreground">{code?.toUpperCase()}</span>
            </p>
            <Button
              onClick={() => navigate(`/player/new?redirect=/join/${code}`)}
              size="lg"
              className="w-full gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Player Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPlayerId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-cinzel font-bold text-foreground text-center">
              Select Player
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              Choose which player to link to campaign code: <span className="font-mono font-bold">{code?.toUpperCase()}</span>
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onSelect={() => handleSelectPlayer(player.id)}
                onDelete={() => {}} // No delete in this flow
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/player/new')}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create New Player
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="rounded-2xl shadow-xl border-brass/30 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dice6 className="w-8 h-8 text-brass" />
          </div>
          <CardTitle className="font-cinzel text-2xl">Join Campaign</CardTitle>
          <CardDescription>
            Link your player profile to this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Campaign Code: <span className="font-mono font-bold text-foreground">{code?.toUpperCase()}</span>
          </p>

          {selectedPlayer && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-4"
                style={{
                  borderColor: selectedPlayer.color,
                  background: `linear-gradient(135deg, ${selectedPlayer.color}20, ${selectedPlayer.color}40)`,
                  color: selectedPlayer.color,
                }}
              >
                {selectedPlayer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{selectedPlayer.name}</p>
                <p className="text-sm text-muted-foreground">Selected player</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleLink}
              disabled={linking}
              size="lg"
              className="w-full"
            >
              {linking ? 'Linking...' : 'Link & Join'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedPlayerId(null)}
              className="w-full"
            >
              Choose Different Player
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinCode;
