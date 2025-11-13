import FactionDirectory from "@/components/factions/FactionDirectory";

import { DemoCampaign } from "@/data/demoSeeds";

interface FactionsTabProps {
  campaignId: string;
}

export function FactionsTab({ campaignId }: FactionsTabProps) {
  return (
    <div className="h-full">
      <FactionDirectory 
        campaignId={campaignId} 
        isDM={true}
      />
    </div>
  );
}
