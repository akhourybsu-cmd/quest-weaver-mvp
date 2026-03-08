import { Navigate, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerNotesView } from '@/components/player/PlayerNotesView';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

const PlayerNotes = () => {
  const { player, loading } = usePlayer();
  const navigate = useNavigate();

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
    <PlayerPageLayout playerId={player.id} mobileTitle="Shared Notes">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/player/${player.id}`)}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-cinzel font-bold text-foreground">Shared Notes</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-4xl font-cinzel font-bold text-foreground">Shared Notes</h1>
            <p className="text-muted-foreground mt-2">View notes and information your DM has shared with you</p>
          </div>
        </div>
        <PlayerNotesView playerId={player.id} />
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerNotes;
