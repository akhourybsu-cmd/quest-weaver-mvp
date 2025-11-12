import { useParams, Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
import { PlayerCharacterList } from '@/components/player/PlayerCharacterList';
import { CampaignTile } from '@/components/player/CampaignTile';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PlayerDashboardNew = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { getPlayer, loading: playerLoading } = usePlayer();
  const { links, loading: linksLoading } = usePlayerLinks(playerId);

  if (!playerId) {
    return <Navigate to="/player" replace />;
  }

  const player = getPlayer(playerId);

  if (playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/player" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex">
      <PlayerNavigation playerId={playerId} />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
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
              <PlayerCharacterList playerId={playerId} />
            </TabsContent>

            <TabsContent value="campaigns">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-cinzel font-bold text-foreground">My Campaigns</h2>
                  <p className="text-muted-foreground mt-1">
                    Your active and pinned adventures
                  </p>
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
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map((link) => (
                      <CampaignTile
                        key={link.id}
                        link={link}
                        playerId={playerId}
                        onUnlink={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboardNew;
