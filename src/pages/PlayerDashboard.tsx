import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { CampaignTile } from '@/components/player/CampaignTile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Link2, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const PlayerDashboard = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { getPlayer, setLastPlayerId } = usePlayer();
  const { links, loading, unlinkCampaign } = usePlayerLinks(playerId);

  const player = playerId ? getPlayer(playerId) : null;

  useEffect(() => {
    if (playerId) {
      setLastPlayerId(playerId);
    }
  }, [playerId, setLastPlayerId]);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Player not found</p>
          <Button onClick={() => navigate('/player')}>Back to Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/player')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4"
              style={{
                borderColor: player.color,
                background: `linear-gradient(135deg, ${player.color}20, ${player.color}40)`,
              }}
            >
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span style={{ color: player.color }}>
                  {player.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-cinzel font-bold text-foreground">
                {player.name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <User className="w-4 h-4" />
                Player Profile
              </p>
            </div>

            {/* Actions */}
            <Button onClick={() => navigate(`/player/${playerId}/link`)} className="gap-2">
              <Link2 className="w-4 h-4" />
              Link Campaign
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-cinzel font-bold mb-2">My Campaigns</h2>
            <p className="text-muted-foreground">
              {links.length === 0 
                ? 'No campaigns linked yet. Link to a campaign to get started!' 
                : `You're linked to ${links.length} campaign${links.length === 1 ? '' : 's'}`
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : links.length === 0 ? (
            <Card className="rounded-2xl shadow-xl border-brass/30">
              <CardHeader>
                <CardTitle className="font-cinzel text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Ask your DM for a campaign code to join your first adventure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate(`/player/${playerId}/link`)} size="lg" className="gap-2">
                  <Link2 className="w-5 h-5" />
                  Link to Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link) => (
                <div key={link.id}>
                  <CampaignTile
                    link={link}
                    playerId={player.id}
                    onUnlink={() => {
                      // Open alert dialog
                      const button = document.querySelector(`[data-link-id="${link.id}"]`);
                      if (button) (button as HTMLButtonElement).click();
                    }}
                  />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        data-link-id={link.id} 
                        className="hidden"
                        aria-hidden="true"
                      />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your link to this campaign. You can re-link using the campaign code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => unlinkCampaign(link.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PlayerDashboard;
