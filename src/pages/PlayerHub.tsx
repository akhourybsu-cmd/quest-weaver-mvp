import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/contexts/AuthContext';

const PlayerHub = () => {
  const navigate = useNavigate();
  const { player, loading } = usePlayer();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/');
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!loading && player) {
      navigate(`/player/${player.id}`);
    }
  }, [loading, player, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brass/5">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  return null;
};

export default PlayerHub;
