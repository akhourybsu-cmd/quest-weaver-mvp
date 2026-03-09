import { DemoCampaign } from "@/data/demoSeeds";
import { getDemoCampaignStats, adaptDemoNPCs, adaptDemoFactions } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Scroll, Users, MapPin, Flag, User, Shield, Swords } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DemoOverviewTabProps {
  campaign: DemoCampaign;
}

export function DemoOverviewTab({ campaign }: DemoOverviewTabProps) {
  const stats = getDemoCampaignStats(campaign);
  const npcs = adaptDemoNPCs(campaign);
  const factions = adaptDemoFactions(campaign);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scroll className="w-4 h-4 text-arcanePurple" />
              <span className="text-xs text-muted-foreground font-medium">Active Quests</span>
            </div>
            <div className="text-2xl font-cinzel font-bold">{stats.activeQuests}</div>
            <p className="text-xs text-muted-foreground">{stats.completedQuests} completed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-arcanePurple" />
              <span className="text-xs text-muted-foreground font-medium">Party</span>
            </div>
            <div className="text-2xl font-cinzel font-bold">{stats.partyMembers}</div>
            <p className="text-xs text-muted-foreground">Adventurers</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-arcanePurple" />
              <span className="text-xs text-muted-foreground font-medium">Locations</span>
            </div>
            <div className="text-2xl font-cinzel font-bold">{campaign.locations.length}</div>
            <p className="text-xs text-muted-foreground">Discovered</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-brass/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-arcanePurple" />
              <span className="text-xs text-muted-foreground font-medium">Encounters</span>
            </div>
            <div className="text-2xl font-cinzel font-bold">{campaign.encounters.length}</div>
            <p className="text-xs text-muted-foreground">Prepared</p>
          </CardContent>
        </Card>
      </div>

      {/* Story Progress */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-cinzel text-sm sm:text-base">Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Main Storyline</span>
              <Badge variant="outline" className="border-arcanePurple/50 text-arcanePurple text-xs">
                In Progress
              </Badge>
            </div>
            <Progress value={60} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeQuests} active quests, {stats.completedQuests} completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Party Preview */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-cinzel text-sm sm:text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-arcanePurple" />
            Party
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {campaign.party.map((pc) => (
              <div key={pc.id} className="flex items-center gap-3 p-2 rounded-lg border border-brass/10 bg-card/30">
                <Avatar className="w-10 h-10 border border-arcanePurple/30">
                  <AvatarFallback className="bg-arcanePurple/20 text-ink font-cinzel text-sm">
                    {pc.portraitInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{pc.name}</p>
                  <p className="text-xs text-muted-foreground">Lvl {pc.level} {pc.class}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NPCs Preview */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-cinzel text-sm sm:text-base flex items-center gap-2">
            <User className="w-4 h-4 text-arcanePurple" />
            Key NPCs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {npcs.slice(0, 5).map((npc) => (
              <div key={npc.id} className="flex flex-col items-center text-center">
                <Avatar className="w-14 h-14 border-2 border-brass/30">
                  <AvatarImage src={npc.portrait_url} alt={npc.name} />
                  <AvatarFallback className="bg-card text-muted-foreground font-cinzel">
                    {npc.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-2 text-sm font-medium truncate w-full">{npc.name}</p>
                <p className="text-xs text-muted-foreground truncate w-full">{npc.role_title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Factions Preview */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-cinzel text-sm sm:text-base flex items-center gap-2">
            <Flag className="w-4 h-4 text-arcanePurple" />
            Factions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {factions.map((faction) => (
              <div
                key={faction.id}
                className="relative overflow-hidden rounded-lg border border-brass/20"
              >
                {faction.banner_url && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${faction.banner_url})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/85 to-card/80" />
                  </>
                )}
                <div className="relative z-10 p-4">
                  <h4 className="font-cinzel font-semibold drop-shadow-md">{faction.name}</h4>
                  {faction.motto && (
                    <p className="text-xs text-muted-foreground italic mt-1">"{faction.motto}"</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {faction.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
