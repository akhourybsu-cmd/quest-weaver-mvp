import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/contexts/AuthContext';

const PlayerHub = () => {
  const navigate = useNavigate();
  const { player, loading, refreshPlayer } = usePlayer();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate(`/auth?redirect=${encodeURIComponent("/player-hub")}`, { replace: true });
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

  // Authenticated, finished loading, no player profile — show fallback
  if (session && !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brass/5 p-4">
        <Card className="max-w-md w-full rounded-2xl border-brass/30 shadow-xl">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl text-brass flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              No Player Profile
            </CardTitle>
            <CardDescription>
              You're signed in, but you don't have a player profile yet. Create one to access the Player Hub, or head to the Campaign Hub if you're a Dungeon Master.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => refreshPlayer()} className="w-full">
              Create Player Profile
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/campaign-hub">Go to Campaign Hub</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default PlayerHub;
