import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerCharacterList } from '@/components/player/PlayerCharacterList';
import { CampaignTile } from '@/components/player/CampaignTile';
import { JoinCampaignDialog } from '@/components/player/JoinCampaignDialog';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Users, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            Manage your characters and campaigns from your dashboard
          </p>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="characters" className="gap-2">
              <Shield className="w-4 h-4" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Users className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            <PlayerCharacterList playerId={player.id} />
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-cinzel font-bold text-foreground">My Campaigns</h2>
                  <p className="text-muted-foreground mt-1">
                    Your active and pinned adventures
                  </p>
                </div>
                <Button onClick={() => setJoinDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Join Campaign
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
          </TabsContent>
        </Tabs>
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
