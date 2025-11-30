import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerQuestTracker } from "@/components/player/PlayerQuestTracker";
import { PlayerNPCDirectory } from "@/components/player/PlayerNPCDirectory";
import { PlayerLocationsView } from "@/components/player/PlayerLocationsView";

import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerCampaignView() {
  const { campaignCode } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignCode) return;
    loadCampaign();
  }, [campaignCode]);

  const loadCampaign = async () => {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("code", campaignCode)
      .single();

    setCampaign(data);
    setLoading(false);
  };

  if (loading) {
    return <Skeleton className="h-screen" />;
  }

  if (!campaign) {
    return <div className="p-8 text-center">Campaign not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-cinzel mb-6">{campaign.name}</h1>
      
      <Tabs defaultValue="quests">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="mt-4">
          <PlayerQuestTracker campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="npcs" className="mt-4">
          <PlayerNPCDirectory campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <PlayerLocationsView campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="text-center py-8 text-muted-foreground">Campaign notes view coming soon</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}