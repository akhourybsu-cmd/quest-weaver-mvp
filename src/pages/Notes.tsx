import { useSearchParams, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import QuestLog from "@/components/quests/QuestLog";
import NPCDirectory from "@/components/npcs/NPCDirectory";
import LootPool from "@/components/loot/LootPool";
import HandoutViewer from "@/components/handouts/HandoutViewer";
import { ArrowLeft } from "lucide-react";

const Notes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";

  if (!campaignId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No campaign selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Campaign Notes</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <QuestLog campaignId={campaignId} isDM={isDM} />
        <NPCDirectory campaignId={campaignId} isDM={isDM} />
        <LootPool campaignId={campaignId} isDM={isDM} />
        <HandoutViewer campaignId={campaignId} isDM={isDM} />
      </div>

      <BottomNav role={isDM ? "dm" : "player"} />
    </div>
  );
};

export default Notes;
