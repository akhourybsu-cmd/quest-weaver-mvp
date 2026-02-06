import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerCharacterList } from '@/components/player/PlayerCharacterList';
import { Loader2 } from 'lucide-react';

const PlayerCharactersPage = () => {
  const { player, loading } = usePlayer();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/" replace />;
  }

  return (
    <PlayerPageLayout playerId={player.id} mobileTitle="My Characters">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8 hidden md:block">
          <h1 className="text-4xl font-cinzel font-bold text-foreground">My Characters</h1>
          <p className="text-muted-foreground mt-2">View and manage all your characters across campaigns</p>
        </div>
        <PlayerCharacterList playerId={player.id} />
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerCharactersPage;
