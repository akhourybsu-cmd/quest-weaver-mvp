import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';

const PlayerHub = () => {
  const navigate = useNavigate();
  const { player, loading } = usePlayer();

  useEffect(() => {
    if (!loading && player) {
      // Auto-redirect to player dashboard
      navigate(`/player/${player.id}`);
    }
  }, [loading, player, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brass/5">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brass/5">
        <div className="text-center">
          <h1 className="text-4xl font-cinzel font-bold text-foreground mb-4">
            Welcome to Quest Weaver
          </h1>
          <p className="text-muted-foreground">
            Please sign in to continue
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PlayerHub;
