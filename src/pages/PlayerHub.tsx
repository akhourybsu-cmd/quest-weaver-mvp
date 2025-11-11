import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerCard } from '@/components/player/PlayerCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Dice6 } from 'lucide-react';

const PlayerHub = () => {
  const navigate = useNavigate();
  const { players, loading, deletePlayer, setLastPlayerId } = usePlayer();

  const handleSelectPlayer = (playerId: string) => {
    setLastPlayerId(playerId);
    navigate(`/player/${playerId}`);
  };

  const handleDeletePlayer = (playerId: string) => {
    deletePlayer(playerId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-cinzel font-bold text-foreground flex items-center gap-2">
                <Dice6 className="w-8 h-8 text-brass" />
                Player Hub
              </h1>
              <p className="text-muted-foreground mt-1">
                Select your player profile to join campaigns
              </p>
            </div>
            <Button onClick={() => navigate('/player/new')} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Create Player
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {players.length === 0 ? (
          <Card className="rounded-2xl shadow-xl border-brass/30">
            <CardHeader>
              <CardTitle className="font-cinzel text-2xl">Welcome to Quest Weaver</CardTitle>
              <CardDescription>
                Create your first player profile to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/player/new')} size="lg" className="gap-2">
                <UserPlus className="w-5 h-5" />
                Create Your First Player
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onSelect={() => handleSelectPlayer(player.id)}
                onDelete={() => handleDeletePlayer(player.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlayerHub;
