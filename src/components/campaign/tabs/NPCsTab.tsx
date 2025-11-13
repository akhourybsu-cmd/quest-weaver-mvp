import EnhancedNPCDirectory from "@/components/npcs/EnhancedNPCDirectory";

import { DemoCampaign } from "@/data/demoSeeds";

interface NPCsTabProps {
  campaignId: string;
}

export function NPCsTab({ campaignId }: NPCsTabProps) {
  return (
    <div className="h-full">
      <EnhancedNPCDirectory 
        campaignId={campaignId} 
        isDM={true}
      />
    </div>
  );
}
