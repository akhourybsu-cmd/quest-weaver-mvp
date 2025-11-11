import DMItemVault from "@/components/inventory/DMItemVault";

interface ItemVaultTabProps {
  campaignId: string;
}

export function ItemVaultTab({ campaignId }: ItemVaultTabProps) {
  return (
    <div className="h-full">
      <DMItemVault campaignId={campaignId} onRefresh={() => {}} />
    </div>
  );
}
