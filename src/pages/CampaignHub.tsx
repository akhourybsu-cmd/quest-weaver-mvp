import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sword, Users, Plus, LogIn, Scroll } from "lucide-react";

const CampaignHub = () => {
  const navigate = useNavigate();
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignName, setCampaignName] = useState("");

  const handleCreateCampaign = () => {
    if (campaignName.trim()) {
      // Generate a simple campaign code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/session/dm?campaign=${code}`);
    }
  };

  const handleJoinCampaign = () => {
    if (campaignCode.trim()) {
      navigate(`/session/player?campaign=${campaignCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scroll className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Campaign Manager
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Run immersive D&D 5E sessions with real-time sync, minimal screen time, and powerful DM tools
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Choose Your Role</CardTitle>
            <CardDescription className="text-base">
              Start a new campaign as DM or join an existing one as a player
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dm" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dm" className="text-base">
                  <Sword className="w-4 h-4 mr-2" />
                  Dungeon Master
                </TabsTrigger>
                <TabsTrigger value="player" className="text-base">
                  <Users className="w-4 h-4 mr-2" />
                  Player
                </TabsTrigger>
              </TabsList>

              {/* DM Tab */}
              <TabsContent value="dm" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name" className="text-base">
                      Campaign Name
                    </Label>
                    <Input
                      id="campaign-name"
                      placeholder="The Lost Mines of Phandelver"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleCreateCampaign}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-accent-foreground">DM Features</h3>
                  <ul className="text-sm text-accent-foreground space-y-1 list-disc list-inside">
                    <li>Run combat with initiative tracking</li>
                    <li>Manage party HP, conditions, and resources</li>
                    <li>Reveal handouts and control visibility</li>
                    <li>Access full SRD monster library</li>
                    <li>Session journal and notes</li>
                  </ul>
                </div>
              </TabsContent>

              {/* Player Tab */}
              <TabsContent value="player" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-code" className="text-base">
                      Campaign Code
                    </Label>
                    <Input
                      id="campaign-code"
                      placeholder="ABC123"
                      value={campaignCode}
                      onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                      className="h-12 text-base uppercase"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinCampaign}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Join Campaign
                  </Button>
                </div>

                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-accent-foreground">Player Features</h3>
                  <ul className="text-sm text-accent-foreground space-y-1 list-disc list-inside">
                    <li>Manage your character sheet</li>
                    <li>Roll dice with advantage/disadvantage</li>
                    <li>Track HP, spell slots, and resources</li>
                    <li>Take notes during sessions</li>
                    <li>View shared handouts and quest log</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sword className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Sync</h3>
              <p className="text-sm text-muted-foreground">
                All players see updates instantly, even offline
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Heads-Up Play</h3>
              <p className="text-sm text-muted-foreground">
                Common actions in ≤2 taps, focus on the table
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-status-buff/10 flex items-center justify-center mx-auto mb-3">
                <Scroll className="w-6 h-6 text-status-buff" />
              </div>
              <h3 className="font-semibold mb-2">SRD Complete</h3>
              <p className="text-sm text-muted-foreground">
                Full 5E rules reference at your fingertips
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignHub;
