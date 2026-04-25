import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { CampaignTile } from '@/components/player/CampaignTile';
import { JoinCampaignDialog } from '@/components/player/JoinCampaignDialog';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Plus, ChevronRight } from 'lucide-react';

const PlayerDashboardNew = () => {
  const { player, loading: playerLoading } = usePlayer();
  const { links, loading: linksLoading, refreshLinks } = usePlayerLinks(player?.id);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  if (playerLoading) {
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
    <PlayerPageLayout playerId={player.id} mobileTitle={`${player.name}'s Dashboard`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Desktop Welcome Header */}
        <div className="mb-6 md:mb-8 hidden md:block">
          <h1 className="text-4xl font-cinzel font-bold text-foreground">
            Welcome, {player.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Your campaigns and quick links
          </p>
        </div>

        {/* Quick link to characters */}
        <Link to={`/player/${player.id}/characters`} className="block mb-6">
          <Card className="rounded-2xl border-brass/30 hover:border-brass/60 hover:bg-brass/5 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brass/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brass" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-semibold text-foreground">My Characters</p>
                <p className="text-xs text-muted-foreground">View and manage all your heroes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Campaigns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-foreground">My Campaigns</h2>
              <p className="text-sm text-muted-foreground mt-1 hidden md:block">
                Your active and pinned adventures
              </p>
            </div>
            <Button onClick={() => setJoinDialogOpen(true)} className="gap-2 shrink-0" size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Join Campaign</span>
              <span className="sm:hidden">Join</span>
            </Button>
          </div>

          {linksLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-brass" />
            </div>
          ) : links.length === 0 ? (
            <Card className="rounded-2xl shadow-xl border-brass/30">
              <CardHeader>
                <CardTitle className="font-cinzel text-2xl">No Campaigns Yet</CardTitle>
                <CardDescription>
                  Join a campaign using a code from your Dungeon Master
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setJoinDialogOpen(true)} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Join Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link) => (
                <CampaignTile
                  key={link.id}
                  link={link}
                  playerId={player.id}
                  onUnlink={refreshLinks}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <JoinCampaignDialog
        open={joinDialogOpen}
        onClose={() => {
          setJoinDialogOpen(false);
          refreshLinks();
        }}
        playerId={player.id}
      />
    </PlayerPageLayout>
  );
};

export default PlayerDashboardNew;
