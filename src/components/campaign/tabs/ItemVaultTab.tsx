import DMItemVault from "@/components/inventory/DMItemVault";

import { DemoCampaign } from "@/data/demoSeeds";

interface ItemVaultTabProps {
  campaignId: string;
}

export function ItemVaultTab({ campaignId }: ItemVaultTabProps) {
  return (
    <div className="h-full">
      <DMItemVault 
        campaignId={campaignId} 
        onRefresh={() => {}}
      />
    </div>
  );
}
