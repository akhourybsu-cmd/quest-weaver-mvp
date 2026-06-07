import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerNotesView } from '@/components/player/PlayerNotesView';
import { BackButton } from '@/components/ui/back-button';
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
    <PlayerPageLayout playerId={player.id} mobileTitle="Shared Notes">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <BackButton fallback={`/player/${player.id}`} label="Back" />
            <h1 className="text-2xl font-cinzel font-bold text-foreground">Shared Notes</h1>
          </div>
          <div className="hidden md:block">
            <p className="font-cinzel text-brass/60 tracking-[0.3em] text-xs uppercase mb-2">From the Dungeon Master</p>
            <h1 className="text-4xl font-cinzel font-bold text-foreground tracking-wide">Shared Notes</h1>
            <p className="text-muted-foreground font-cormorant text-lg italic mt-1">Lore and secrets your DM has shared with you</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-brass/50" />
              <div className="w-2 h-2 rotate-45 bg-brass/70 rounded-sm" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-brass/50" />
            </div>
          </div>
        </div>
        <PlayerNotesView playerId={player.id} />
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerNotes;
