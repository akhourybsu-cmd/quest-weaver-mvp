import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerCard } from '@/components/player/PlayerCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Dice6, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5">
      {/* Hero Section */}
      <header className="border-b border-brass/20 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-cinzel font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-brass/20 to-brass/10 border border-brass/30">
                  <Dice6 className="w-8 h-8 text-brass" />
                </div>
                Quest Weaver
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Choose your identity and begin your adventure
              </p>
            </div>
            <Button 
              onClick={() => navigate('/player/new')} 
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <UserPlus className="w-5 h-5" />
              Create Player
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {players.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl shadow-2xl border-brass/30 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="text-center space-y-4 pt-12">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-brass/20 to-brass/10 border-2 border-brass/30 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-brass" />
                </div>
                <CardTitle className="font-cinzel text-3xl text-foreground">
                  Welcome to Quest Weaver
                </CardTitle>
                <CardDescription className="text-base">
                  Create your first player profile and embark on epic adventures with your party
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <Button 
                  onClick={() => navigate('/player/new')} 
                  size="lg" 
                  className="gap-2 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Create Your First Player
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-cinzel font-bold text-foreground">
                Select Your Character
              </h2>
              <p className="text-muted-foreground mt-2">
                Choose a player profile to manage characters and join campaigns
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSelect={() => handleSelectPlayer(player.id)}
                  onDelete={() => handleDeletePlayer(player.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlayerHub;
