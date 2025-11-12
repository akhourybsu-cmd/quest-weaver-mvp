import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
import { PlayerNotesView } from '@/components/player/PlayerNotesView';
import { Loader2 } from 'lucide-react';

const PlayerNotes = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex">
      <PlayerNavigation playerId={player.id} />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-cinzel font-bold text-foreground">
              Shared Notes
            </h1>
            <p className="text-muted-foreground mt-2">
              View notes and information your DM has shared with you
            </p>
          </div>

          <PlayerNotesView playerId={player.id} />
        </div>
      </div>
    </div>
  );
};

export default PlayerNotes;
